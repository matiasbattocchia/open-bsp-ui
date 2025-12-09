import { useEffect, useState } from "react";
import { BarDatum, ResponsiveBar } from "@nivo/bar";
import { supabase } from "@/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
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
      return;
    }
    setError(null);
    try {
      setIsLoading(true);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: response, error } = await supabase.functions.invoke(
        "analytics",
        {
          body: {
            orgId: activeOrgId,
            startDate: startOfMonth.toISOString(),
            endDate: new Date().toISOString(),
          },
        },
      );

      if (error) throw error;

      const resp = JSON.parse(response);

      setConversationData(resp.conversations.data);
      setTotalConversations(resp.conversations.total);
    } catch (err) {
      setError("Failed to fetch conversation data");
      console.error(err);
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
      <div className="mb-[18px]">
        {t("Total de conversaciones")}: {totalConversations}
      </div>
      <div style={{ height: "400px" }}>
        <ResponsiveBar
          data={conversationData}
          keys={["count"]}
          indexBy="date"
          margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors="#fddbc7"
          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Date",
            legendPosition: "middle",
            legendOffset: 32,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Total",
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
    </div>
  );
}
