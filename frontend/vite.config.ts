import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";

export default defineConfig({
  // Relative asset URLs keep the same build portable across localhost,
  // Vercel and repository-scoped GitHub Pages hosting.
  base: "./",
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: `${cesiumSource}/ThirdParty/**/*`,
          dest: `${cesiumBaseUrl}/ThirdParty`,
          rename: { stripBase: 5 }
        },
        {
          src: `${cesiumSource}/Workers/**/*`,
          dest: `${cesiumBaseUrl}/Workers`,
          rename: { stripBase: 5 }
        },
        {
          src: `${cesiumSource}/Assets/**/*`,
          dest: `${cesiumBaseUrl}/Assets`,
          rename: { stripBase: 5 }
        },
        {
          src: `${cesiumSource}/Widgets/**/*`,
          dest: `${cesiumBaseUrl}/Widgets`,
          rename: { stripBase: 5 }
        }
      ]
    })
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify(`./${cesiumBaseUrl}`)
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
