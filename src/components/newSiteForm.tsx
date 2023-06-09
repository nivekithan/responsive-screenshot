import { Form, FormProps, useNavigation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { LabeledInput } from "./ui/labeledInput";
import { Button } from "./ui/button";
import { FieldConfig } from "@conform-to/react";

export type NewSiteFormProps = {
  urlConfig: FieldConfig<string>;
  nameConfig: FieldConfig<string>;

  formProps: FormProps;
};

export function NewSiteForm({
  formProps,
  urlConfig,
  nameConfig,
}: NewSiteFormProps) {
  const navigation = useNavigation();

  const isFormSubmitting =
    navigation.state === "submitting" &&
    navigation.formData.has(nameConfig.name);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screenshot new site</CardTitle>
        <CardDescription>
          Provided site should be accessible without any authorization
        </CardDescription>
      </CardHeader>
      <Form method="post" {...formProps}>
        <CardContent className="flex gap-y-2 flex-col">
          <LabeledInput
            label="Name:"
            id="new-page-name"
            {...nameConfig}
            placeholder="Landing page"
            type="text"
          />
          <LabeledInput
            label="Url of page:"
            id="new-page-url"
            {...urlConfig}
            placeholder="https://example.com"
            type="url"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isFormSubmitting}>
            {isFormSubmitting
              ? "Generating screenshots..."
              : "Generate Screenshot"}
          </Button>
        </CardFooter>
      </Form>
    </Card>
  );
}
