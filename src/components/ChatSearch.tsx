import { Input } from "antd";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import useBoundStore from "@/store/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";

export default function ChatSearch() {
  const searchPattern = useBoundStore((state) => state.ui.searchPattern);
  const setSearchPattern = useBoundStore((state) => state.ui.setSearchPattern);

  const { translate: t } = useTranslation();

  return (
    <div className="px-[12px] py-[7px] flex bg-white border-r border-gray-line">
      <Input
        placeholder={t("Buscar") as string}
        variant="borderless"
        className="bg-gray h-[35px] text-gray-dark"
        value={searchPattern}
        prefix={<SearchOutlined className="mr-[15px]" />}
        allowClear={{ clearIcon: <CloseOutlined /> }}
        onChange={(e) => setSearchPattern(e.target.value)}
      />
    </div>
  );
}
