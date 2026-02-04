import { serverApi } from "../../../lib/server-api";
import StorefrontClient from "./StorefrontClient";

export default async function StorefrontPage({ params }) {
  let store = null;
  try {
    store = await serverApi(`/store/${params.slug}`);
  } catch (error) {
    store = null;
  }

  return <StorefrontClient store={store} slug={params.slug} />;
}
