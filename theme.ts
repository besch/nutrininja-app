import { createTheme } from "@rneui/themed";

export const theme = createTheme({
  lightColors: {
    primary: "#2089dc",
    secondary: "#ca71eb",
    background: "#ffffff",
    white: "#ffffff",
    black: "#000000",
    grey0: "#393e42",
    grey1: "#43484d",
    grey2: "#5e6977",
    grey3: "#86939e",
    grey4: "#bdc6cf",
    grey5: "#e1e8ee",
  },
  components: {
    Text: {
      h1Style: { fontSize: 32 },
      h2Style: { fontSize: 28 },
      h3Style: { fontSize: 24 },
      h4Style: { fontSize: 20 },
      style: { fontSize: 16 },
    },
    Button: {
      raised: true,
      titleStyle: {
        fontSize: 16,
      },
    },
    TabItem: {
      titleStyle: {
        fontSize: 12,
      },
    },
  },
  mode: "light",
});
