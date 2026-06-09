import { instance } from "./axiosInterceptor";
import { toast } from "sonner";

/**
 * Sanitizes and serializes React Flow canvas nodes/edges by stripping heavy
 * DOM-related layout states (e.g. width, height, selected, dragging) to
 * produce a clean DAG graph layout matching the NestJS Mongoose models.
 * 
 * Nodes: Returns ONLY { id, type, position: { x, y }, data }
 * Edges: Returns ONLY { id, source, target, sourceHandle }
 */
export function serializeFlowPayload(name, nodes, edges) {
  const cleanNodes = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: {
      x: Math.round(node.position?.x || 0),
      y: Math.round(node.position?.y || 0),
    },
    data: node.data || {},
  }));

  const cleanEdges = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || null,
  }));

  return {
    name: name || `Sequence_${Date.now()}`,
    graph: {
      nodes: cleanNodes,
      edges: cleanEdges,
    },
  };
}

/**
 * Helper to robustly parse error messages from NestJS backend API responses.
 * Handles both plain string messages and nested validation error arrays.
 */
function getErrorMessage(error, defaultMessage) {
  if (typeof error === "string") return error;
  
  const responseMessage = error?.response?.data?.message;
  return (
    (Array.isArray(responseMessage) ? responseMessage[0] : responseMessage) ||
    error?.message ||
    defaultMessage
  );
}

/**
 * Sends the serialized graph layout payload to the NestJS backend
 */
export async function saveAutomationFlow(payload) {
  try {
    const adminId = payload.adminId || "";
    const projectId = payload.projectId || "";
    const url = `automations/flow?adminId=${adminId}&projectId=${projectId}`;
    const { data } = await instance.post(url, { ...payload, flowType: payload.flowType || 'crm' });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to save automation flow:", error);
    const errorMessage = getErrorMessage(error, "Failed to save workflow due to network error");
    return { success: false, error: errorMessage };
  }
}

export async function publishAutomationFlow(flowId, adminId = "", projectId = "") {
  try {
    const url = `automations/flow/${flowId}/publish?adminId=${adminId}&projectId=${projectId}`;
    const { data } = await instance.patch(url);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to publish automation flow:", error);
    const errorMessage = getErrorMessage(error, "Failed to publish workflow due to network error");
    return { success: false, error: errorMessage };
  }
}

export async function getFlowsByProject(projectId, adminId = "", flowType = "crm") {
  try {
    const { data } = await instance.get(`automations/project/${projectId}?adminId=${adminId}&flowType=${flowType}`);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch project workflows:", error);
    const errorMessage = getErrorMessage(error, "Failed to retrieve workflows due to connection issues");
    return { success: false, error: errorMessage };
  }
}

export async function updateFlowStatus(flowId, status, adminId = "", projectId = "") {
  try {
    const url = `automations/flow/${flowId}/status?adminId=${adminId}&projectId=${projectId}`;
    const { data } = await instance.patch(url, { status, adminId, projectId });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to toggle workflow status:", error);
    const errorMessage = getErrorMessage(error, "Failed to update status due to network mismatch");
    return { success: false, error: errorMessage };
  }
}

export async function deleteAutomationFlow(flowId, adminId = "", projectId = "") {
  try {
    const url = `automations/${flowId}?adminId=${adminId}&projectId=${projectId}`;
    const { data } = await instance.delete(url);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to delete automation flow:", error);
    const errorMessage = getErrorMessage(error, "Failed to delete workflow due to network error");
    return { success: false, error: errorMessage };
  }
}

class FlowApiService {
  /**
   * Publish or Update a visual workflow graph definition in MongoDB
   */
  async saveWorkflow(name, nodes, edges, existingFlowId = null) {
    try {
      const payload = serializeFlowPayload(name, nodes, edges);
      payload.flowType = 'crm';
      let response;

      if (existingFlowId) {
        response = await instance.put(`automations/${existingFlowId}`, payload);
      } else {
        response = await saveAutomationFlow(payload);
      }

      if (response.success) {
        toast.success("Workflow published successfully!");
      } else {
        toast.error(response.error || "Failed to publish workflow");
      }
      return response;
    } catch (error) {
      console.error("Failed to publish workflow:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to publish workflow due to a connection error";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Fetch all workflow definitions in the workspace
   */
  async getWorkflows() {
    try {
      const { data } = await instance.get('automations');
      return { success: true, data };
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      toast.error("Failed to load workflows.");
      return { success: false, data: [] };
    }
  }

  /**
   * Fetch a single workflow definition by ID
   */
  async getWorkflowById(id) {
    try {
      const { data } = await instance.get(`automations/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error(`Failed to fetch workflow ${id}:`, error);
      toast.error("Failed to load workflow configuration.");
      return { success: false, data: null };
    }
  }

  /**
   * Delete a workflow definition by ID
   */
  async deleteWorkflow(id) {
    try {
      await instance.delete(`automations/${id}`);
      toast.success("Workflow deleted successfully!");
      return { success: true };
    } catch (error) {
      console.error(`Failed to delete workflow ${id}:`, error);
      toast.error("Failed to delete selected workflow.");
      return { success: false };
    }
  }
}

const flowApiService = new FlowApiService();
export default flowApiService;
