import { useRoutes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ConfigurationGuard from "@/components/ConfigurationGuard";

const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const DashboardLayout = lazy(() => import("@/pages/dashboard/DashboardLayout").then(m => ({ default: m.default })));
const Templates = lazy(() => import("@/pages/dashboard/Template/Templates").then(m => ({ default: m.default })));
const CreateTemplatePage = lazy(() => import("@/pages/dashboard/Template/CreateTemplatePage").then(m => ({ default: m.default })));
const ConfiguredTemplatesList = lazy(() => import("@/pages/dashboard/ConfiguredTemplates/ConfiguredTemplatesList").then(m => ({ default: m.default })));
const CreateConfiguredTemplate = lazy(() => import("@/pages/dashboard/ConfiguredTemplates/CreateConfiguredTemplate").then(m => ({ default: m.default })));
const SendMessage = lazy(() => import("@/pages/dashboard/SendMessage/SendMessage").then(m => ({ default: m.default })));
const WabaDetails = lazy(() => import("@/pages/dashboard/Template/WabaDetails").then(m => ({ default: m.default })));
const Configuration = lazy(() => import("@/pages/dashboard/Configuration/Configuration").then(m => ({ default: m.default })));
const Programs = lazy(() => import("@/pages/dashboard/Programs/Programs").then(m => ({ default: m.default })));
const CreateProgram = lazy(() => import("@/pages/dashboard/Programs/CreateProgram").then(m => ({ default: m.default })));
const ProgramDetails = lazy(() => import("@/pages/dashboard/Programs/ProgramDetails").then(m => ({ default: m.default })));
const ContactsPage = lazy(() => import("@/pages/dashboard/Contacts/ContactsPage").then(m => ({ default: m.default })));
const TagsPage = lazy(() => import("@/pages/dashboard/Tags/TagsPage").then(m => ({ default: m.default })));
const CampaignsList = lazy(() => import("@/pages/dashboard/Campaigns/CampaignsList").then(m => ({ default: m.default })));
const CreateCampaign = lazy(() => import("@/pages/dashboard/Campaigns/CreateCampaign").then(m => ({ default: m.default })));
const CampaignDetails = lazy(() => import("@/pages/dashboard/Campaigns/CampaignDetails").then(m => ({ default: m.default })));
const ApiCampaignsList = lazy(() => import("@/pages/dashboard/Campaigns/ApiCampaignsList").then(m => ({ default: m.default })));
const ApiCampaignCreate = lazy(() => import("@/pages/dashboard/Campaigns/ApiCampaignCreate").then(m => ({ default: m.default })));
const ApiCampaignDetails = lazy(() => import("@/pages/dashboard/Campaigns/ApiCampaignDetails").then(m => ({ default: m.default })));
const AutoMessageConfigsListPage = lazy(() => import("@/pages/dashboard/AutoMessage/AutoMessageConfigsListPage").then(m => ({ default: m.default })));
const AutoMessageConfig = lazy(() => import("@/pages/dashboard/AutoMessage/AutoMessageConfig").then(m => ({ default: m.default })));

const MessageHistory = lazy(() => import("@/pages/dashboard/MessageHistory/MessageHistory").then(m => ({ default: m.default })));
const ProfileManagement = lazy(() => import("@/pages/dashboard/Profile/ProfileManagement").then(m => ({ default: m.default })));
const MediaFilesPage = lazy(() => import("@/pages/dashboard/MediaFilesPage").then(m => ({ default: m.default })));
const AutomationsList = lazy(() => import("@/pages/dashboard/Automations/AutomationsList").then(m => ({ default: m.default })));
const AutomationBuilder = lazy(() => import("@/pages/dashboard/Automations/AutomationBuilder").then(m => ({ default: m.default })));
const ChatPage = lazy(() => import("@/pages/dashboard/Chat/ChatPage").then(m => ({ default: m.default })));
const ChatbotTriggersListPage = lazy(() => import("@/pages/dashboard/Chatbot/ChatbotTriggersListPage").then(m => ({ default: m.default })));
const CreateChatbotTriggerPage = lazy(() => import("@/pages/dashboard/Chatbot/CreateChatbotTriggerPage").then(m => ({ default: m.default })));
const EditChatbotTriggerPage = lazy(() => import("@/pages/dashboard/Chatbot/EditChatbotTriggerPage").then(m => ({ default: m.default })));
const OptedOutNumbersPage = lazy(() => import("@/pages/dashboard/OptedOut/OptedOutNumbersPage").then(m => ({ default: m.default })));
const ChatFlowBuilder = lazy(() => import("@/pages/dashboard/ChatFlowBuilder").then(m => ({ default: m.default })));


const routes = [
  {
    path: "/",
    element: <ProjectsPage />,
  },
  {
    path: "dashboard/:projectId",
    element: <DashboardLayout />,
    children: [
      { path: "templates", element: <ConfigurationGuard><Templates /></ConfigurationGuard> },
      { path: "templates/create", element: <ConfigurationGuard><CreateTemplatePage /></ConfigurationGuard> },
      { path: "configured-templates", element: <ConfigurationGuard><ConfiguredTemplatesList /></ConfigurationGuard> },
      { path: "configured-templates/create", element: <ConfigurationGuard><CreateConfiguredTemplate /></ConfigurationGuard> },
      { path: "send-message", element: <ConfigurationGuard><SendMessage /></ConfigurationGuard> },
      { path: "contacts", element: <ConfigurationGuard><ContactsPage /></ConfigurationGuard> },
      { path: "tags", element: <ConfigurationGuard><TagsPage /></ConfigurationGuard> },
      { path: "campaigns", element: <ConfigurationGuard><CampaignsList /></ConfigurationGuard> },
      { path: "campaigns/create", element: <ConfigurationGuard><CreateCampaign /></ConfigurationGuard> },
      { path: "campaigns/:campaignId", element: <ConfigurationGuard><CampaignDetails /></ConfigurationGuard> },
      { path: "api-campaigns", element: <ConfigurationGuard><ApiCampaignsList /></ConfigurationGuard> },
      { path: "api-campaigns/create", element: <ConfigurationGuard><ApiCampaignCreate /></ConfigurationGuard> },
      { path: "api-campaigns/:campaignId", element: <ConfigurationGuard><ApiCampaignDetails /></ConfigurationGuard> },
      { path: "auto-message", element: <ConfigurationGuard><AutoMessageConfigsListPage /></ConfigurationGuard> },
      { path: "auto-message/create", element: <ConfigurationGuard><AutoMessageConfig /></ConfigurationGuard> },

      { path: "templates/waba", element: <ConfigurationGuard><WabaDetails /></ConfigurationGuard> },
      { path: "message-history/:projectId", element: <ConfigurationGuard><MessageHistory /></ConfigurationGuard> },
      { path: "profile", element: <ConfigurationGuard><ProfileManagement /></ConfigurationGuard> },
      { path: "media-files", element: <ConfigurationGuard><MediaFilesPage /></ConfigurationGuard> },
      { path: "automations", element: <ConfigurationGuard><AutomationsList /></ConfigurationGuard> },
      { path: "automations/:automationId", element: <ConfigurationGuard><AutomationBuilder /></ConfigurationGuard> },
      { path: "chat", element: <ConfigurationGuard><ChatPage /></ConfigurationGuard> },
      { path: "chatbot", element: <ConfigurationGuard><ChatbotTriggersListPage /></ConfigurationGuard> },
      { path: "chatbot/create", element: <ConfigurationGuard><CreateChatbotTriggerPage /></ConfigurationGuard> },
      { path: "chatbot/:triggerId/edit", element: <ConfigurationGuard><EditChatbotTriggerPage /></ConfigurationGuard> },
      { path: "chatflow-builder", element: <ConfigurationGuard><ChatFlowBuilder /></ConfigurationGuard> },
      { path: "opted-out-numbers", element: <ConfigurationGuard><OptedOutNumbersPage /></ConfigurationGuard> },
      { path: "configuration", element: <Configuration /> },
      { path: "programs", element: <ConfigurationGuard><Programs /></ConfigurationGuard> },
      { path: "programs/create", element: <ConfigurationGuard><CreateProgram /></ConfigurationGuard> },
      { path: "programs/:programId/edit", element: <ConfigurationGuard><CreateProgram /></ConfigurationGuard> },
      { path: "programs/:programId", element: <ConfigurationGuard><ProgramDetails /></ConfigurationGuard> },
      { index: true, element: <Navigate to="configuration" replace /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/whatsapp" replace />,
  },
];

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600">Loading page...</p>
    </div>
  </div>
);

export default function AppRoutes() {
  const element = useRoutes(routes);
  return <Suspense fallback={<LoadingFallback />}>{element}</Suspense>;
}

