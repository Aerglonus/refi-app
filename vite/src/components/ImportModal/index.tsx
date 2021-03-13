import { actionImportDocs } from "@/atoms/firestore.action";
import { navigatorCollectionPathAtom } from "@/atoms/navigator";
import { importFileAtom, isImportModalAtom } from "@/atoms/ui";
import { ignoreBackdropEvent, readerFilePromise } from "@/utils/common";
import { Button } from "@zendeskgarden/react-buttons";
import { Field, FileUpload, Input, Label } from "@zendeskgarden/react-forms";
import {
  Body,
  Footer,
  FooterItem,
  Header,
  Modal,
} from "@zendeskgarden/react-modals";
import React, { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue } from "recoil";
import csvtojson from "csvtojson";

const ImportModal = () => {
  const collectionPath = useRecoilValue(navigatorCollectionPathAtom);
  const [file, setFile] = useRecoilState(importFileAtom);
  const [docs, setDocs] = useState<any[]>([]);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ["application/json", "text/comma-separated-values", "text/csv"],
    onDrop,
    multiple: false,
  });

  const [isShowImportModal, setShowImportModal] = useRecoilState(
    isImportModalAtom
  );

  const { register, handleSubmit, setValue } = useForm();

  const onSubmit = (value: any) => {
    console.log(value);

    actionImportDocs(value.path, docs).then(() => {
      setFile(undefined);
      setShowImportModal(false);
    });
  };

  const parseJSONDocFile = (data: string): any[] => {
    const fileData = JSON.parse(data);
    return Array.isArray(fileData) ? fileData : [fileData];
  };

  const parseCSVDocFile = (data: string): Promise<any[]> => {
    return new Promise((resolve) => {
      csvtojson().fromString(data).then(resolve);
    });
  };

  useEffect(() => {
    // TODO: Migrate me to worker to reduce the UI thread workload
    if (file) {
      readerFilePromise(file).then((fileData) => {
        if (file.type.indexOf("csv") >= 0) {
          parseCSVDocFile(fileData).then(setDocs);
        } else {
          setDocs(parseJSONDocFile(fileData));
        }
      });
    } else {
      setDocs([]);
    }
  }, [file]);

  useEffect(() => {
    setValue("path", collectionPath);
  }, [isShowImportModal]);

  const handleOnCancel = () => {
    setShowImportModal(false);
    setFile(undefined);
  };

  // TODO: Path picker, validate path
  // TODO: Add analysis like: Preview import file, how many docs will be imported, warning if it not match current collection schema

  return (
    <div>
      {isShowImportModal && (
        <Modal
          isAnimated={false}
          isLarge
          focusOnMount
          backdropProps={{ onClick: ignoreBackdropEvent }}
          appendToNode={document.querySelector("#root") || undefined}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Header>Import data</Header>
            <Body>
              <Field>
                <Label>Path</Label>
                <Input
                  isCompact
                  name="path"
                  defaultValue={collectionPath}
                  ref={register}
                />
              </Field>
              <Field className="mt-4">
                <FileUpload {...getRootProps()} isDragging={isDragActive}>
                  {isDragActive ? (
                    <span>Drop JSON/CSV file here</span>
                  ) : (
                    <span>Choose a JSON/CSV data file to import</span>
                  )}
                  <Input {...getInputProps()} />
                </FileUpload>
              </Field>
              <Field className="mt-4">
                <Label>File</Label>
                <div>{file?.name}</div>
              </Field>
              <div>- With {docs.length} doc(s)</div>
            </Body>
            <Footer>
              <FooterItem>
                <Button size="small" onClick={() => handleOnCancel()}>
                  Cancel
                </Button>
              </FooterItem>
              <FooterItem>
                <Button size="small" isPrimary type="submit">
                  Import
                </Button>
              </FooterItem>
            </Footer>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ImportModal;