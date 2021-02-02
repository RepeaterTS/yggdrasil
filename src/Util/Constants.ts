export const Constants = {
  DefaultUserAgent: "Minecraft",
  Mojang: {
    DefaultHost: "https://authserver.mojang.com",
  },
  MCLeaks: {
    DefaultHost: "https://auth.mcleaks.net/v1",
  },
  XSTSRelyingParty: "rp://api.minecraftservices.com/",
  MinecraftServicesLogWithXbox:
    "https://api.minecraftservices.com/authentication/login_with_xbox",
  MinecraftServicesEntitlement:
    "https://api.minecraftservices.com/entitlements/mcstore",
  MinecraftServicesProfile:
    "https://api.minecraftservices.com/minecraft/profile",
  MSAL: {
    auth: {
      clientId: "389b1b32-b5d5-43b2-bddc-84ce938d6737",
      authority: "https://login.microsoftonline.com/consumers",
    },
  },
  MSAL_SCOPES: ["XboxLive.signin", "offline_access"],
};
