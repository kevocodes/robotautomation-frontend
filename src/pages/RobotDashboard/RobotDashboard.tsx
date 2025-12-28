import { PageContainer } from "@/components/platform/PageContainer/PageContainer";
import { useEffect, useRef, useState } from "react";
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ResponseError } from "@/models/responseError.model";

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
  state: "DESCONECTADO",
  imu_ok: true,
  yaw: 0,
  step: 0,
  total_steps: 0,
  clean_elapsed: 0,
  clean_total: 0,
  clean_progress: 0,
};

// Metrics to reset when disconnected or idle
const RESET_METRICS = {
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
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateRef = useRef<string>(DEFAULT_TELEMETRY.state);

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

    // Watchdog reset function
    const resetWatchdog = () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      watchdogRef.current = setTimeout(() => {
        setTelemetry((prev) => ({
          ...prev,
          state: "DESCONECTADO",
          ...RESET_METRICS,
        }));
        setElapsedTime(0);
      }, 5000);
    };

    const handleMessage = (event: MessageEvent) => {
      // console.log("SSE Data received:", event.data); // Commented out to reduce noise
      resetWatchdog();
      try {
        const data = JSON.parse(event.data);
        // Ensure data matches expected structure or merge with defaults if partial
        setTelemetry((prev) => ({ ...prev, ...data }));

        // Sync local timer with received elapsed time using threshold to prevent flickering
        if (data.clean_elapsed !== undefined) {
          setElapsedTime((prev) => {
            // Only sync if drift is > 2 seconds to avoid jitter between local interval and server updates
            if (Math.abs(data.clean_elapsed - prev) > 3000) {
              return data.clean_elapsed;
            }
            return prev;
          });
        }

        // Check if state has changed to RETORNANDO_A_BASE to show toast only once
        if (
          data.state &&
          data.state === "RETORNANDO_A_BASE" &&
          lastStateRef.current !== "RETORNANDO_A_BASE"
        ) {
          toast.success("Desinfección de Sala Completada");
        }

        // Update last known state and telemetry
        setTelemetry((prev) => {
          let newTelemetry = { ...prev, ...data };

          // If returning to IDLE/DISCONNECTED, reset active metrics (yaw, steps, progress)
          if (
            data.state === "ESPERANDO_MISION" ||
            data.state === "DESCONECTADO"
          ) {
            newTelemetry = { ...newTelemetry, ...RESET_METRICS };
            setElapsedTime(0);
          }

          return newTelemetry;
        });

        if (data.state) {
          lastStateRef.current = data.state;
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
      setTelemetry((prev) => ({
        ...prev,
        state: "DESCONECTADO",
        ...RESET_METRICS,
      }));
      setElapsedTime(0);
    };

    // Initialize watchdog
    resetWatchdog();

    return () => {
      eventSource.removeEventListener("mqtt", handleMessage);
      eventSource.close();
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, [token]);

  // Local timer for smooth updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (telemetry.state.includes("DESINFECCIÓN")) {
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
    if (state.includes("DESINFECCIÓN"))
      return "bg-green-100 text-green-700 border-green-200";
    if (state === "RETORNANDO_A_BASE" || state === "MODO_SEGURIDAD")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (state === "ESPERANDO_MISION")
      return "bg-slate-100 text-slate-700 border-slate-200";
    if (state === "DESCONECTADO")
      return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-blue-100 text-blue-700 border-blue-200"; // Navigation states
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
      <div className="flex flex-col gap-6 w-full @container">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Gestión de Robot Autónomo</h2>
        </div>

        {/* IMU Alert */}
        {!telemetry.imu_ok && (
          <Alert variant="destructive" className="bg-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>FALLO CRÍTICO</AlertTitle>
            <AlertDescription>
              FALLO DE SENSOR INERCIAL (IMU). El robot puede perder orientación.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 @lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <Card className="md:col-span-1 @lg:col-span-1">
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
                {isLoading ? "Enviando..." : "Ejecutar desinfección"}
              </Button>
            </CardContent>
          </Card>

          {/* Status Monitor */}
          <Card className="md:col-span-2 @lg:col-span-2">
            <CardHeader>
              <CardTitle>Monitor de Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row @2xl:flex-row gap-8 items-center justify-between">
                {/* Left Side Group: Status & Steps */}
                <div className="flex flex-col gap-8 flex-1 w-full">
                  {/* Status Badge Group */}
                  <div className="flex flex-col gap-2 w-full">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Estado Global
                    </span>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-6 py-2.5 rounded-xl border text-xl md:text-3xl @md:text-3xl font-black tracking-tight shadow-sm transition-colors duration-300 ${getStateColor(
                          telemetry.state
                        )}`}
                      >
                        {telemetry.state.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Step Indicator Bar */}
                  <div
                    className={`w-full bg-slate-50/80 p-4 rounded-xl border border-slate-100/80 flex items-center justify-between gap-6 transition-all duration-300 ${
                      ["DESCONECTADO", "ESPERANDO_MISION"].includes(
                        telemetry.state
                      )
                        ? "opacity-50 grayscale"
                        : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg
                          className="w-full h-full -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            className="text-slate-200"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="text-slate-800 transition-all duration-700 ease-out"
                            strokeDasharray={`${
                              (telemetry.step /
                                Math.max(telemetry.total_steps, 1)) *
                              100
                            }, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-slate-600">
                          {Math.round(
                            (telemetry.step /
                              Math.max(telemetry.total_steps, 1)) *
                              100
                          )}
                          %
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Progreso de Rutina
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-slate-800">
                            Paso {telemetry.step}{" "}
                            <span className="text-slate-400 font-medium text-sm">
                              / {telemetry.total_steps}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compass Widget */}
                <div
                  className={`relative w-40 h-40 border-8 border-slate-50 rounded-full flex items-center justify-center bg-white shadow-inner shrink-0 transition-all duration-300 ${
                    ["DESCONECTADO", "ESPERANDO_MISION"].includes(
                      telemetry.state
                    )
                      ? "opacity-50 grayscale"
                      : "opacity-100"
                  }`}
                >
                  {/* Labels - moved to back */}
                  <span className="absolute top-2 text-[10px] font-extrabold text-slate-300 select-none">
                    N
                  </span>
                  <span className="absolute bottom-2 text-[10px] font-extrabold text-slate-300 select-none">
                    S
                  </span>
                  <span className="absolute left-2 text-[10px] font-extrabold text-slate-300 select-none">
                    W
                  </span>
                  <span className="absolute right-2 text-[10px] font-extrabold text-slate-300 select-none">
                    E
                  </span>

                  <div
                    className="absolute w-full h-full transition-transform duration-500 ease-out z-20"
                    style={{ transform: `rotate(${telemetry.yaw}deg)` }}
                  >
                    <div className="relative w-full h-full">
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-16 bg-rose-500 rounded-full shadow-lg" />
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-2 h-16 bg-slate-200 rounded-full shadow-sm" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white border-4 border-slate-100 rounded-full z-30 shadow-md" />
                    </div>
                  </div>

                  <div className="absolute -bottom-6 bg-white px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-500 shadow-sm border">
                    {telemetry.yaw}°
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mission Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 @lg:grid-cols-2 gap-6">
          <Card
            className={`transition-opacity duration-300 ${
              telemetry.state.includes("DESINFECCIÓN")
                ? "opacity-100"
                : "opacity-40 grayscale pointer-events-none"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-800">Desinfección</CardTitle>
                <span
                  className={`text-sm px-2 py-0.5 rounded font-medium ${
                    telemetry.clean_progress >= 100
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {telemetry.clean_progress >= 100
                    ? "Completado"
                    : "En Progreso"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">
                    {telemetry.clean_progress.toFixed(1)}
                    <span className="text-lg text-slate-400 font-medium ml-1">
                      %
                    </span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground mb-1">
                    Progreso Total
                  </span>
                </div>
                <Progress
                  value={telemetry.clean_progress}
                  className="h-6 rounded-lg bg-slate-100"
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`transition-opacity duration-300 ${
              telemetry.state.includes("DESINFECCIÓN")
                ? "opacity-100"
                : "opacity-40 grayscale pointer-events-none"
            }`}
          >
            <CardHeader>
              <CardTitle>Tiempo de desinfección</CardTitle>
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
