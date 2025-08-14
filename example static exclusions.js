// Substrings in hostnames that typically indicate CDNs or static content
    var bypassHostPatterns = [
        "cdn", "static", "assets", "images", "img", "media", "fonts", "js", "css", "videos",
        "akamai", "akamaized", "cloudfront", "fastly", "netdna", "stackpath", "cachefly",
        "gstatic", "fbcdn", "azureedge", "cloudflare"
    ];

    // File extensions for common static assets
    var staticExtensions = [
        ".js", ".css", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
        ".woff", ".woff2", ".ttf", ".eot", ".otf", ".mp4", ".webm", ".m4v"
    ];

    // Bypass if hostname contains typical CDN/static keywords
    for (var i = 0; i < bypassHostPatterns.length; i++) {
        if (shExpMatch(host, "*" + bypassHostPatterns[i] + "*")) {
            return "DIRECT";
        }
    }

    // Bypass if the URL ends with known static file extensions
    var lowerUrl = url.toLowerCase();
    for (var j = 0; j < staticExtensions.length; j++) {
        if (shExpMatch(lowerUrl, "*" + staticExtensions[j])) {
            return "DIRECT";
        }
    }