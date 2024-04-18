export interface User {
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string;
    total: 0;
  };
  href: string;
  id: string;
  type: "user";
  uri: string;
  display_name: string;
  images?: {
    url: string;
    height?: number;
    width?: number;
  }[];
}
