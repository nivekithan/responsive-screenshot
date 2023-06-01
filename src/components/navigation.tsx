import { Form } from "react-router-dom";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function Navigation() {
  return (
    <div>
      <nav className="flex justify-between px-6 py-3 items-center">
        <h1 className="text-lg font-semibold leading-none tracking-tight">
          Responsive Screenshots
        </h1>
        <Form action="/logout" method="post">
          <Button variant="outline" type="submit">
            Logout
          </Button>
        </Form>
      </nav>
      <Separator />
    </div>
  );
}
