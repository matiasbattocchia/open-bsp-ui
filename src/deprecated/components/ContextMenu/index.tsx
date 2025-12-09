import { useContextMenu } from "../../hooks/useContextMenu";

import styles from "./ContextMenu.module.css";
import { type Dispatch, type SetStateAction } from "react";

const ContextMenu = ({
  setOrgId,
  displayInfo,
}: {
  setOrgId: Dispatch<SetStateAction<string>>;
  displayInfo: Dispatch<SetStateAction<boolean>>;
}) => {
  const { target, anchorPoint, isShown } = useContextMenu();

  if (!target) return;

  const orgId = document.evaluate(
    'ancestor-or-self::div[contains(@class, "org")]/@id',
    target,
    null,
    XPathResult.STRING_TYPE,
    null,
  ).stringValue;

  return (
    isShown && (
      <ul
        className={styles.ContextMenu}
        style={{ top: anchorPoint.y, left: anchorPoint.x }}
      >
        <li
          onClick={() => {
            setOrgId(orgId);
            displayInfo(true);
          }}
        >
          Edit prompt
        </li>
      </ul>
    )
  );
};

export { ContextMenu };
