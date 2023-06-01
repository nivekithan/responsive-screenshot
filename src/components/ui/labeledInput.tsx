import React from "react";
import { Input } from "./input";
import { Label } from "./label";

export type LabeledInputArgs = {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
  id: string;
  type: React.HTMLInputTypeAttribute;
  error?: string;
};

export function LabeledInput({
  label,
  name,
  placeholder,
  defaultValue,
  id,
  type,
  error,
}: LabeledInputArgs) {
  return (
    <div className="flex flex-col gap-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        placeholder={placeholder}
        defaultValue={defaultValue}
        name={name}
        id={id}
        type={type}
      />
      <p className="text-destructive text-sm font-medium">
        {error ? error : null}
      </p>
    </div>
  );
}
