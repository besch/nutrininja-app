import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@/styles/theme";
import { IconSymbol, type IconSymbolName } from "@/components/ui/IconSymbol";

const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icon = getIconForRoute(route.name);

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
          >
            <IconSymbol
              name={icon}
              size={24}
              color={isFocused ? colors.primary : "#9CA3AF"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const getIconForRoute = (routeName: string): IconSymbolName => {
  switch (routeName) {
    case "Home":
      return "house.fill";
    case "Analytics":
      return "chevron.left.forwardslash.chevron.right";
    case "Settings":
      return "chevron.right";
    default:
      return "house.fill";
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
});

export default TabBar;
