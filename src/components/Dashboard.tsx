import { useEffect, useState } from "react";
import { BarDatum, ResponsiveBar } from "@nivo/bar";
import { supabase } from "@/supabase/client";
import { useTranslation } from "react-dialect";
import useBoundStore from "@/store/useBoundStore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Flex, Heading } from "@radix-ui/themes";

interface ConversationData extends BarDatum {
  date: string;
  count: number;
}

export default function Dashboard() {
  const [conversationData, setConversationData] = useState<ConversationData[]>(
    [],
  );
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [agentStats, setAgentStats] = useState({
    active: 0,
    draft: 0,
    inactive: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const { translate: t } = useTranslation();

  useEffect(() => {
    fetchConversationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConversationData = async () => {
    if (!activeOrgId) {
      setError("No active organization");
      setIsLoading(false);
      return;
    }
    setError(null);
    try {
      setIsLoading(true);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      console.log('Fetching data for org:', activeOrgId, 'from:', startOfMonth.toISOString());

      // Fetch conversations directly from database
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("contact_address, organization_address, created_at, organization_id")
        .eq("organization_id", activeOrgId)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", new Date().toISOString())
        .order("created_at", { ascending: true });

      if (convError) {
        console.error('Conversations error:', convError);
        throw convError;
      }

      console.log('Conversations fetched:', conversations?.length || 0, conversations);

      // Fetch messages count for this month - using organization_id instead of organization_address
      const { count: messagesCount, error: msgError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      if (msgError) {
        console.warn('Messages count error (non-critical):', msgError);
      }

      console.log('Messages count:', messagesCount);

      // Fetch all agents and their states
      const { data: allAgents, error: agentError } = await supabase
        .from("agents")
        .select("extra->>mode, ai")
        .eq("organization_id", activeOrgId)
        .eq("ai", true);

      if (agentError) {
        console.warn('Agents fetch error (non-critical):', agentError);
      }

      console.log('All agents fetched:', allAgents);

      // Count agents by status
      const agentCounts = {
        active: 0,
        draft: 0,
        inactive: 0,
        total: 0
      };

      allAgents?.forEach((agent) => {
        const mode = agent.mode || 'inactive'; // default to inactive if no mode
        agentCounts.total++;
        
        switch (mode) {
          case 'active':
            agentCounts.active++;
            break;
          case 'draft':
            agentCounts.draft++;
            break;
          case 'inactive':
          default:
            agentCounts.inactive++;
            break;
        }
      });

      console.log('Agent stats:', agentCounts);

      // Group conversations by date
      const conversationsByDate: { [key: string]: number } = {};
      conversations?.forEach((conv) => {
        const date = new Date(conv.created_at).toISOString().split('T')[0];
        conversationsByDate[date] = (conversationsByDate[date] || 0) + 1;
      });

      console.log('Conversations by date:', conversationsByDate);

      // Convert to chart data format - only include dates with conversations
      const chartData: ConversationData[] = Object.entries(conversationsByDate).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        count,
      }));

      // Sort by date
      chartData.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      });

      console.log('Final chart data:', chartData);

      setConversationData(chartData);
      setTotalConversations(conversations?.length || 0);
      setTotalMessages(messagesCount || 0);
      setAgentStats(agentCounts);
    } catch (err) {
      setError(`Failed to fetch dashboard data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="overflow-y-auto p-[16px] bg-white grow">
        <div className="flex items-center font-bold text-2xl mb-[18px]">
          {t("Cargando...")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="overflow-y-auto p-[16px] bg-white grow">
        <div className="flex items-center font-bold text-2xl mb-[18px]">
          {t("Error: ")}{error}
        </div>
      </div>
    );

  return (
    <div className="overflow-y-auto p-[16px] bg-white grow">
      <Flex align="center" gap="4">
        <Link href="/" className="lg:hidden">
          <ArrowLeft className="text-gray-icon" />
        </Link>
        <Heading>{t("Conversaciones este mes")}</Heading>
      </Flex>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">{t("Total de conversaciones")}</p>
              <p className="text-2xl font-bold text-blue-800">{totalConversations}</p>
            </div>
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">{t("Mensajes del mes")}</p>
              <p className="text-2xl font-bold text-green-800">{totalMessages}</p>
            </div>
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-purple-600 font-medium">{t("Estado de agentes")}</p>
              <p className="text-2xl font-bold text-purple-800">{agentStats.total}</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    {t("Activos")}
                  </span>
                  <span className="font-semibold text-green-600">{agentStats.active}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-1"></span>
                    {t("Borrador")}
                  </span>
                  <span className="font-semibold text-amber-600">{agentStats.draft}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                    {t("Inactivos")}
                  </span>
                  <span className="font-semibold text-red-600">{agentStats.inactive}</span>
                </div>
              </div>
            </div>
            <div className="text-purple-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{t("Conversaciones por día")}</h3>
        {conversationData.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No hay conversaciones para mostrar este mes</p>
            </div>
          </div>
        ) : (
          <div style={{ height: "400px" }}>
            <ResponsiveBar
              data={conversationData}
              keys={["count"]}
              indexBy="date"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: "linear" }}
              indexScale={{ type: "band", round: true }}
              colors="#3B82F6"
              borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Fecha",
                legendPosition: "middle",
                legendOffset: 32,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Conversaciones",
                legendPosition: "middle",
                legendOffset: -40,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
              legends={[
                {
                  dataFrom: "keys",
                  anchor: "bottom-right",
                  direction: "column",
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: "left-to-right",
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]}
              role="application"
              ariaLabel="Conversations chart"
              barAriaLabel={function (e) {
                return e.id + ": " + e.formattedValue + " in date: " + e.indexValue;
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
