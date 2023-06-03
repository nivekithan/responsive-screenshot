import { Link } from "react-router-dom";

export type ScreenshotImageLinkProps = {
  url: string;
  name: string;
  originalUrl: string;
  id: string;
};

export function ScreenshotImageLink({
  name,
  originalUrl,
  url,
  id,
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
        <p className="pt-2">{name}</p>
        <p className="text-sm text-muted-foreground">{originalUrl}</p>
      </div>
    </Link>
  );
}
