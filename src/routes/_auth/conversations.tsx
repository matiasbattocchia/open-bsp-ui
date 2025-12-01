import { createFileRoute } from "@tanstack/react-router";
import ChatList from "@/components/ChatList";
import ChatSearch from "@/components/ChatSearch";

export const Route = createFileRoute("/_auth/conversations")({
    component: Conversations,
});

function Conversations() {
    return (
        <div className="flex flex-col h-full bg-white">
            <ChatSearch />
            <ChatList />
        </div>
    );
}
