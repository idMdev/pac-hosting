function FindProxyForURL(url, host) {
  // Update the TenantId with your own tenant (must be enrolled in the GSA EFP preview)
  var tenantId = "beee99f9-ff92-4b15-bddd-652c8204f79f";
  var efpEndpoint = "internet.efp.globalsecureaccess.microsoft.com";
  var efpUrl = "HTTPS " + tenantId + "." + efpEndpoint;

  // Dynamic PAC file host (will be replaced by server based on request Host header)
  var pacFileRequestHost = "DYNAMIC_PAC_HOST_PLACEHOLDER";

  // CRITICAL: Always exclude PAC file requests to prevent infinite loops
  // This should be the first check to ensure PAC file retrieval never goes through proxy
  if (pacFileRequestHost !== "DYNAMIC_PAC_HOST_PLACEHOLDER" && dnsDomainIs(host, pacFileRequestHost)) {
    return "DIRECT";
  }

  //----------------------PROXY MODE CONFIGURATION----------------------//
  // Set to true for ALL-PROXY mode: All traffic goes through EFP except exclusions
  // Set to false for SOME-PROXY mode: Only specified domains go through EFP
  var ALL_PROXY_MODE = true;
  //----------------------PROXY MODE CONFIGURATION----------------------//


  //----------------------Start Admin-Defined Proxy Domains----------------------//
  // Domains that MUST go through EFP (for SOME_PROXY_MODE)
  //var customInclusions = [
  //  "www.facebook.com",
  //  "*.facebook.com",
  //  "www.yahoo.com",
  //  "*.yahoo.com",
  //  "www.openai.com",
  //  "*.openai.com"
  //];
  //----------------------End Admin-Defined Proxy Domains----------------------//

  //----------------------Start Admin-Defined Exclusions----------------------//
  // Add any additional domains that should bypass EFP
  var customExclusions = [
    // "*.internal.contoso.com",
    // "vpn.contoso.com"
  ];
  //----------------------End Admin-Defined Exclusions----------------------//

  //----------------------Start Authentication FQDNs bypassed by EFP----------------------//
  //CRITICAL: DO NOT MODIFY Entra ID Authentication URLs. These must be bypassed for EFP to work correctly.
  var requiredAuth = [
    "login.microsoftonline.com",
    "login.microsoft.com",
    "login.windows.net",
    "login.microsoftonline-p.com",
    "loginex.microsoftonline.com",
    "login-us.microsoftonline.com",
    "login.live.com",
    "aadcdn.msftauth.net",
    "msftauth.net",
    "aadcdn.msauth.net"
  ];

  //IMPORTANT: If you are using a federated identity provider with Entra ID, you may need to add additional domains here.
  var requiredAuthFederated = [
    // Add your federated identity provider domains here
    // "adfs.yourdomain.com",
    // "sso.yourdomain.com",
    // "idp.yourdomain.com"
  ];
  //----------------------End Authentication FQDNs bypassed by EFP----------------------//

  //----------------------Start M365 FQDNs bypassed by EFP----------------------//
  //GSA Explicit Forward Proxy requires TLS inspection.
  // Microsoft 365 network connectivity principles guide against TLS inspection. https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-network-connectivity-principles
  var pacFileHost = [
    "pac.azureidentity.us",  // Static fallback
    pacFileRequestHost       // Dynamic host from request
  ];
  
  var m365Common = [
    "*.cloud.microsoft"
  ];

  var m365Exchange = [
    "outlook.office.com",
    "outlook.office365.com",
    "*.outlook.office.com",
    "*.outlook.office365.com",
    "outlook.live.com",
    "*.protection.outlook.com",
    "*.mail.protection.outlook.com"
  ];

  var m365SharePoint = [
    "*.sharepoint.com",
    "*.sharepoint-df.com",
    "*-my.sharepoint.com",
    "*-myfiles.sharepoint.com",
    "*.sharepointonline.com"
  ];

  var m365Teams = [
    "*.teams.microsoft.com",
    "teams.microsoft.com",
    "*.teams.skype.com",
    "*.broadcast.skype.com",
    "*.sfbassets.com",
    "skypemaprdsitus.trafficmanager.net",
    "*.keydelivery.mediaservices.windows.net",
    "*.streaming.mediaservices.windows.net"
  ];
  //----------------------End M365 FQDNs bypassed by EFP----------------------//

  //----------------------Start CDN and Static Content Exclusions----------------------//
  // Substrings in hostnames that typically indicate CDNs or static content
  var bypassHostPatterns = [
    "cdn", "static", "assets", "images", "image", "img", "media", "fonts", "js", "css", "videos",
    "akamai", "akamaized", "cloudfront", "fastly", "netdna", "stackpath", "cachefly",
    "gstatic", "fbcdn", "azureedge", "cloudflare","api.","cdp","demdex","taboola"
  ];

  // File extensions for common static assets
  var staticExtensions = [
    ".js", ".css", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".eot", ".otf", ".mp4", ".webm", ".m4v"
  ];
  //----------------------End CDN and Static Content Exclusions----------------------//

  // Combine all mandatory exclusions (these ALWAYS bypass EFP regardless of mode)
  var mandatoryExclusions = []
    .concat(requiredAuth)
    .concat(requiredAuthFederated)
    .concat(m365Teams)
    .concat(m365Exchange)
    .concat(m365SharePoint)
    .concat(m365Common)
    .concat(pacFileHost);

  // Check mandatory exclusions first (highest priority - always bypass EFP)
  for (var i = 0; i < mandatoryExclusions.length; i++) {
    if (mandatoryExclusions[i].indexOf("*") !== -1) {
      if (shExpMatch(host, mandatoryExclusions[i])) {
        return "DIRECT";
      }
    } else {
      if (dnsDomainIs(host, mandatoryExclusions[i])) {
        return "DIRECT";
      }
    }
  }

  // Check for CDN and static content patterns (bypass proxy for performance)
  // Bypass if hostname contains typical CDN/static keywords
  for (var k = 0; k < bypassHostPatterns.length; k++) {
    if (shExpMatch(host, "*" + bypassHostPatterns[k] + "*")) {
      return "DIRECT";
    }
  }

  // Bypass if the URL ends with known static file extensions (including query strings)
  var lowerUrl = url.toLowerCase();
  for (var l = 0; l < staticExtensions.length; l++) {
    // Check for extension at end of URL
    if (shExpMatch(lowerUrl, "*" + staticExtensions[l])) {
      return "DIRECT";
    }
    // Check for extension followed by query string (?)
    if (shExpMatch(lowerUrl, "*" + staticExtensions[l] + "?*")) {
      return "DIRECT";
    }
  }

  // Check redirect URL for auth (must go through EFP)
  if (dnsDomainIs(host, "ia.auth.globalsecureaccess.microsoft.com")) {
    return efpUrl;
  }

  // Mode-specific logic
  if (ALL_PROXY_MODE) {
    // Everything goes through EFP except exclusions
    // Check admin-defined exclusions
    for (var j = 0; j < customExclusions.length; j++) {
      if (customExclusions[j].indexOf("*") !== -1) {
        if (shExpMatch(host, customExclusions[j])) {
          return "DIRECT";
        }
      } else {
        if (dnsDomainIs(host, customExclusions[j])) {
          return "DIRECT";
        }
      }
    }
    // Default - go through proxy
    return efpUrl;
  } else {
    // Only specified domains go through EFP
    // Check if host matches admin-defined proxy domains
    for (var k = 0; k < customInclusions.length; k++) {
      if (customInclusions[k].indexOf("*") !== -1) {
        if (shExpMatch(host, customInclusions[k])) {
          return efpUrl;
        }
      } else {
        if (dnsDomainIs(host, customInclusions[k])) {
          return efpUrl;
        }
      }
    }
    // Default - go direct
    return "DIRECT";
  }
}