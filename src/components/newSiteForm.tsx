import { Form, FormProps } from "react-router-dom";
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

export type NewSiteFormProps = {
  name: string;
  label: string;
  id: string;
  error?: string;

  formProps: FormProps;
};

export function NewSiteForm({
  id,
  label,
  name,
  formProps,
  error,
}: NewSiteFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Screenshot new site</CardTitle>
        <CardDescription>
          Provided site should be accessible without any authorization
        </CardDescription>
      </CardHeader>
      <Form method="post" {...formProps}>
        <CardContent>
          <LabeledInput
            id={id}
            label={label}
            name={name}
            placeholder="https://example.com"
            type="url"
            error={error}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Generate Screenshot
          </Button>
        </CardFooter>
      </Form>
    </Card>
  );
}
