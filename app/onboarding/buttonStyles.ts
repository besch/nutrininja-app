import { StyleSheet } from "react-native";

const buttonStyles = StyleSheet.create({
  nextButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    width: "100%",
    marginTop: "auto",
    marginBottom: 30,
  },
  nextButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
  },
  nextButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonTextDisabled: {
    color: "#A0A0A0",
  },
});

export default buttonStyles;
