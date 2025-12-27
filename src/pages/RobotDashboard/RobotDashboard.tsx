import { PageContainer } from "@/components/platform/PageContainer/PageContainer";
import { useEffect, useState } from "react";
import { useAuth } from "@/stores/auth.store";
import { getSelectedResources } from "@/services/resources.service";
import { executeRoutine } from "@/services/mqtt.service";
import { SelectedResource } from "@/models/resources.model";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ResponseError } from "@/models/responseError.model";

// Telemetry Interface based on user JSON
interface TelemetryData {
  state: string;
  imu_ok: boolean;
  yaw: number;
  step: number;
  total_steps: number;
  clean_elapsed: number;
  clean_total: number;
  clean_progress: number;
}

const DEFAULT_TELEMETRY: TelemetryData = {
  state: "ESPERANDO_MISION",
  imu_ok: true,
  yaw: 0,
  step: 0,
  total_steps: 0,
  clean_elapsed: 0,
  clean_total: 0,
  clean_progress: 0,
};

function RobotDashboard() {
  const { token } = useAuth();
  const [resources, setResources] = useState<SelectedResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch resources on mount
  useEffect(() => {
    if (token) {
      getSelectedResources(token)
        .then(setResources)
        .catch((err) => toast.error("Error al cargar robots: " + err.message));
    }
  }, [token]);

  // SSE Connection
  useEffect(() => {
    if (!token) return;

    const url = `${
      import.meta.env.VITE_API_URL
    }/mqtt/stream?topic=${encodeURIComponent("/robot/dashboard")}`;
    const eventSource = new EventSource(url);

    console.log("Connecting to SSE:", url);

    const handleMessage = (event: MessageEvent) => {
      console.log("SSE Data received:", event.data);
      try {
        const data = JSON.parse(event.data);
        // Ensure data matches expected structure or merge with defaults if partial
        setTelemetry((prev) => ({ ...prev, ...data }));

        // Sync local timer with received elapsed time
        if (data.clean_elapsed !== undefined) {
          setElapsedTime(data.clean_elapsed);
        }

        // Special notification for completion
        if (data.state === "RETORNANDO_A_BASE") {
          toast.success("Desinfección de Sala Completada");
        }
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    };

    // Backend emits events with type 'mqtt'
    eventSource.addEventListener("mqtt", handleMessage);

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      // Optional: Logic to reconnect or show status
    };

    return () => {
      eventSource.removeEventListener("mqtt", handleMessage);
      eventSource.close();
    };
  }, [token]);

  // Local timer for smooth updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (telemetry.state.includes("LIMPIEZA")) {
        setElapsedTime((prev) => prev + 1000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [telemetry.state]);

  const handleExecute = async () => {
    if (!selectedResourceId) {
      toast.error("Seleccione un robot primero");
      return;
    }

    setIsLoading(true);
    try {
      await executeRoutine({}, selectedResourceId, token!);
      toast.success("Rutina enviada correctamente");
    } catch (error) {
      if (error instanceof ResponseError)
        toast.error("Error al enviar rutina: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // State color mapping
  const getStateColor = (state: string) => {
    if (state.includes("LIMPIEZA")) return "text-green-500";
    if (state === "RETORNANDO_A_BASE") return "text-yellow-500";
    if (state === "ESPERANDO_MISION") return "text-gray-500";
    return "text-blue-500"; // Navigation states
  };

  const formatTime = (ms: number) => {
    if (!ms || ms < 0) return "00:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Gestión de Robot Autónomo
          </h2>
        </div>

        {/* IMU Alert */}
        {!telemetry.imu_ok && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>FALLO CRÍTICO</AlertTitle>
            <AlertDescription>
              FALLO DE SENSOR INERCIAL (IMU). El robot puede perder orientación.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Control Panel */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Panel de Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Seleccionar recurso
                </label>
                <Select
                  onValueChange={setSelectedResourceId}
                  value={selectedResourceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un robot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.resource.name} ({r.resource.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleExecute}
                disabled={
                  isLoading ||
                  !selectedResourceId ||
                  telemetry.state !== "ESPERANDO_MISION"
                }
              >
                {isLoading ? "Enviando..." : "Ejecutar limpieza"}
              </Button>
            </CardContent>
          </Card>

          {/* Status Monitor */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Monitor de Estado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-muted-foreground uppercase tracking-wider">
                  Fase Actual
                </span>
                <span
                  className={`text-2xl md:text-4xl font-black ${getStateColor(
                    telemetry.state
                  )}`}
                >
                  {telemetry.state.replace(/_/g, " ")}
                </span>
                {telemetry.state === "PUSH_INTERSECCION" && (
                  <span className="text-xs animate-pulse">
                    Calculando ruta...
                  </span>
                )}
              </div>

              {/* Compass Widget */}
              <div className="relative w-32 h-32 border-4 border-slate-200 rounded-full flex items-center justify-center bg-slate-50">
                <div
                  className="absolute w-full h-full transition-transform duration-500 ease-in-out"
                  style={{ transform: `rotate(${telemetry.yaw}deg)` }}
                >
                  <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mt-2" />{" "}
                  {/* North marker */}
                  <div className="w-1 h-12 bg-slate-800 mx-auto" />{" "}
                  {/* Needle */}
                </div>
                <div className="z-10 bg-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                  {telemetry.yaw}°
                </div>
                <span className="absolute top-1 text-xs font-bold text-slate-400">
                  N
                </span>
                <span className="absolute bottom-1 text-xs font-bold text-slate-400">
                  S
                </span>
                <span className="absolute left-2 text-xs font-bold text-slate-400">
                  W
                </span>
                <span className="absolute right-2 text-xs font-bold text-slate-400">
                  E
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mission Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className={`transition-opacity duration-300 ${
              telemetry.state.includes("LIMPIEZA")
                ? "opacity-100"
                : "opacity-40 grayscale pointer-events-none"
            }`}
          >
            <CardHeader>
              <CardTitle>Progreso de Limpieza</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stepper */}
              <div className="flex items-center justify-between relative">
                <div className="w-full absolute top-1/2 left-0 h-1 bg-slate-100 -z-10" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-green-500 transition-all duration-1000 -z-10"
                  style={{
                    width: `${
                      (telemetry.step / Math.max(telemetry.total_steps, 1)) *
                      100
                    }%`,
                  }}
                />

                <div className="flex flex-col items-center bg-white px-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      telemetry.step > 0
                        ? "bg-green-500 text-white"
                        : "bg-slate-200"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-xs mt-1">Inicio</span>
                </div>
                <div className="flex flex-col items-center bg-white px-2">
                  <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border">
                    Paso {telemetry.step} / {telemetry.total_steps}
                  </div>
                </div>
                <div className="flex flex-col items-center bg-white px-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      telemetry.step === telemetry.total_steps
                        ? "bg-green-500 text-white"
                        : "bg-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs mt-1">Fin</span>
                </div>
              </div>

              {/* Cleaning Progress - Only visible if cleaning */}
              <div
                className={`transition-opacity duration-300 ${
                  telemetry.state.includes("LIMPIEZA")
                    ? "opacity-100"
                    : "opacity-30 grayscale"
                }`}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    Porcentaje de limpieza
                  </span>
                  <span className="text-sm font-bold">
                    {telemetry.clean_progress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={telemetry.clean_progress} className="h-4" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`transition-opacity duration-300 ${
              telemetry.state.includes("LIMPIEZA")
                ? "opacity-100"
                : "opacity-40 grayscale pointer-events-none"
            }`}
          >
            <CardHeader>
              <CardTitle>Tiempo de limpieza</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold tracking-widest text-slate-800 dark:text-slate-100">
                  {formatTime(elapsedTime)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tiempo Transcurrido
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default RobotDashboard;
