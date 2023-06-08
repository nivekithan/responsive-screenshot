import { PageModel } from "@/lib/convert";
import { Link } from "react-router-dom";

export type ScreenshotImageLinkProps = {
  screenshotPage: PageModel;
};

export function ScreenshotImageLink({
  screenshotPage: { id, url, screenName, width, height, name },
}: ScreenshotImageLinkProps) {
  return (
    <Link to={`/page/${id}`} className="hover:bg-accent pb-2 border rounded-md">
      <div className="w-[150px] text-center rounded-md">
        <img
          alt={`Screenshot of ${name}`}
          src={url}
          className="w-full h-[200px] object-cover object-left-top rounded-md"
          crossOrigin="anonymous"
          loading="lazy"
        />
        <p className="pt-2 overflow-hidden text-ellipsis whitespace-nowrap px-2">
          {screenName}
        </p>
        <p className="text-sm text-muted-foreground">{`${width} x ${height}`}</p>
      </div>
    </Link>
  );
}
