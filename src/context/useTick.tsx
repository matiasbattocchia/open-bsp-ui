import { ReactNode, createContext, useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const TickContext = createContext(dayjs());

const TickProvider = ({ children }: { children: ReactNode }) => {
  const [tick, setTick] = useState(dayjs());

  useEffect(() => {
    // Set up the interval to update the state every minute (60000 ms)
    const interval = setInterval(() => {
      setTick(dayjs());
    }, 60000);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return <TickContext.Provider value={tick}>{children}</TickContext.Provider>;
};

export { TickContext, TickProvider };
