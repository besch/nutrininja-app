import { StyleSheet } from "react-native";

// Common text styles used across overlays
export const textStyles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  error: {
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
  },
});

// Common input styles
export const inputStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  input: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 120,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  unit: {
    fontSize: 18,
    marginLeft: 8,
    color: "#8E8E93",
  },
});

export const overlayStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "80%",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  closeButtonContainer: {
    marginLeft: 'auto',
  },
  closeButton: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: "#000",
    borderRadius: 25,
    paddingVertical: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Common comparison styles
  comparisons: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  macroValues: {
    flexDirection: "row",
    alignItems: "center",
  },
  currentValue: {
    fontSize: 16,
    color: "#666",
  },
  arrow: {
    marginHorizontal: 8,
    color: "#666",
  },
  newValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  increase: {
    color: "#FF3B30",
  },
  decrease: {
    color: "#34C759",
  },
  // Common radio button styles
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: "#000",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#000",
  },
  // Common option styles
  optionsContainer: {
    marginBottom: 20,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  optionLabel: {
    fontSize: 16,
  },
});

// Common modal styles for bottom sheet style overlays
export const bottomSheetOverlayStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
}); 
