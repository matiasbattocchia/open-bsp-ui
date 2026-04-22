import useBoundStore from "@/stores/useBoundStore";
import SearchBar from "@/components/SearchBar";

export default function ChatSearch() {
  const searchPattern = useBoundStore((state) => state.ui.searchPattern);
  const setSearchPattern = useBoundStore((state) => state.ui.setSearchPattern);

  return (
    <SearchBar
      value={searchPattern}
      onChange={setSearchPattern}
    />
  );
}
