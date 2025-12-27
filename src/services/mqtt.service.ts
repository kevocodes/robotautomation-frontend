import { ResponseError } from "@/models/responseError.model";

const BASE_URL = import.meta.env.VITE_API_URL;

export interface ExecRoutineDto {
    qos?: 0 | 1 | 2;
    retain?: boolean;
}

export const executeRoutine = async (
    data: ExecRoutineDto,
    resourceId: string,
    token: string
): Promise<void> => {
    const response = await fetch(`${BASE_URL}/mqtt/exec-routine/${resourceId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new ResponseError("Resource not found", response.status);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new ResponseError(
            errorData.message || "Failed to execute routine",
            response.status
        );
    }
};
