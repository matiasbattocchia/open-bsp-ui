import React from "react";
import type { UploadProps } from "antd";
import { Upload } from "antd";
import useBoundStore from "@/store/useBoundStore";
import { type FileDraft } from "@/store/chatSlice";
import { UploadOutlined } from "@ant-design/icons";
import styles from "./FilePicker.module.css";

const { Dragger } = Upload;

type Props = {
  setHovering: (value: React.SetStateAction<boolean>) => void;
};

/**
 * Component that allows dropping files on the chat area
 * @returns
 */
const FilePicker = (pickerProps: Props) => {
  const { setHovering } = pickerProps;
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);

  const drafts = useBoundStore((store) =>
    store.chat.fileDrafts.get(store.ui.activeConvId || ""),
  );

  const textDraft = useBoundStore((store) =>
    store.chat.textDrafts.get(store.ui.activeConvId || ""),
  );

  const setFileDrafts = useBoundStore(
    (store) => (fileDrafts: FileDraft[]) =>
      store.chat.setConversationFileDrafts(
        store.ui.activeConvId || "",
        fileDrafts,
      ),
  );

  const props: UploadProps = {
    name: "file",
    multiple: true,
    onDrop(e) {
      setHovering(false);
      const files = e.dataTransfer.files;

      if (!files) {
        return;
      }

      const newDrafts = Array.from(files).map<FileDraft>((file) => ({ file }));

      if (drafts?.length) {
        setFileDrafts(drafts.concat(newDrafts));
      } else {
        newDrafts[0].caption = textDraft;
        setFileDrafts(newDrafts);
      }
    },
  };

  return (
    activeConvId && (
      <div
        className={`${styles.dragger} z-40 absolute h-full w-full p-4 bg-white`}
      >
        <Dragger {...props} className={styles.dragArea}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Arrastra el archivo aquí.</p>
        </Dragger>
      </div>
    )
  );
};

export default FilePicker;
