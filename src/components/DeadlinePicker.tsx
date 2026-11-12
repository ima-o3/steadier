import React, { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Modal, View } from "react-native";
import { Button, Copy, useTheme } from "./ui";
export function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function displayDate(value: string) {
  return value
    ? new Date(value + "T12:00:00").toLocaleDateString()
    : "No deadline";
}
export function DeadlinePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTheme(),
    [open, setOpen] = useState(false),
    [draft, setDraft] = useState(new Date());
  return (
    <View style={{ gap: 8 }}>
      <Copy small>Deadline · optional</Copy>
      <Button
        title={value ? displayDate(value) : "Choose a date"}
        onPress={() => {
          setDraft(value ? new Date(value + "T12:00:00") : new Date());
          setOpen(true);
        }}
      />
      {!!value && (
        <Button title="Clear deadline" onPress={() => onChange("")} />
      )}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "#0006",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: t.card,
              padding: 20,
              borderRadius: 24,
              gap: 12,
            }}
          >
            <DateTimePicker
              value={draft}
              mode="date"
              themeVariant={t.bg === "#211D32" ? "dark" : "light"}
              display="spinner"
              onChange={(_, date) => {
                if (date) setDraft(date);
              }}
            />
            <Button
              title="Use this date"
              onPress={() => {
                onChange(dateValue(draft));
                setOpen(false);
              }}
            />
            <Button title="Cancel" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
