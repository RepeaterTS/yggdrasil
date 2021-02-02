import XboxLive from "@xboxreplay/xboxlive-auth";
import fetch from "node-fetch";
import DeviceCodeAuthentication from "./DeviceCodeAuthentication";
import { Constants } from "../../../Util/Constants";

const fetchOptions = {
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "node-minecraft-protocol",
  },
};

/**
 * Authenticates with Microsoft through user credentials, then
 * with Xbox Live, Minecraft, Checks Entitlements and Returns Profile.
 * @param options Username, Password and more authenticating options.
 * @returns {object} { profile: { name: "", id: "" }, accessToken: "" }
 */
export default async function PasswordAuthentication(options: {
  username: string;
  password: string;
}) {
  let XAuthResponse;

  try {
    XAuthResponse = await XboxLive.authenticate(
      options.username,
      options.password,
      { XSTSRelyingParty: Constants.XSTSRelyingParty }
    );
  } catch (e) {
    console.warn(
      `Unable to authenticate with Microsoft using a password...\nRetrying auth with device code...\n (${e.message})`
    );
    return new DeviceCodeAuthentication(options);
  }

  const MinecraftServices = await fetch(
    Constants.MinecraftServicesLogWithXbox,
    {
      method: "post",
      ...fetchOptions,
      body: JSON.stringify({
        identityToken: `XBL3.0 x=${XAuthResponse.userHash};${XAuthResponse.XSTSToken}`,
      }),
    }
  ).then((res) => {
    if (res.ok) return res.json();
    throw Error(res.statusText);
  });

  (fetchOptions.headers as any).Authorization = `Bearer ${MinecraftServices.access_token}`;
  const Entitlements = await fetch(Constants.MinecraftServicesEntitlement, {
    ...fetchOptions,
  }).then((res) => {
    if (res.ok) return res.json();
    throw Error(res.statusText);
  });
  if (Entitlements.items.length === 0)
    throw Error("This user does not own minecraft.");

  const MinecraftProfile = await fetch(Constants.MinecraftServicesProfile, {
    ...fetchOptions,
  }).then((res) => {
    if (res.ok) return res.json();
    throw Error(`Failed to obtain profile data: ${res.statusText}`);
  });

  return {
    profile: { name: MinecraftProfile.name, id: MinecraftProfile.id },
    accessToken: MinecraftServices.access_token,
  };
}
