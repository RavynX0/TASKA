import client from "./client";

export async function listTasks(params = {}) {
  const { data } = await client.get("/tasks", { params });
  return data.tasks;
}

export async function getTask(id) {
  const { data } = await client.get(`/tasks/${id}`);
  return data.task;
}

export async function createTask(payload) {
  const { data } = await client.post("/tasks", payload);
  return data.task;
}

export async function updateTask(id, payload) {
  const { data } = await client.patch(`/tasks/${id}`, payload);
  return data.task;
}

export async function updateTaskStatus(id, status) {
  const { data } = await client.patch(`/tasks/${id}/status`, { status });
  return data.task;
}

export async function deleteTask(id) {
  await client.delete(`/tasks/${id}`);
}
