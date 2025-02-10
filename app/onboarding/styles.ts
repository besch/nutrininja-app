import { StyleSheet } from "react-native";

const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 40,
  },
  optionButton: {
    width: "100%",
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  optionButtonSelected: {
    backgroundColor: "#000000",
  },
  optionText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },
  optionsContainer: {
    gap: 12,
  },
  button: {
    width: "100%",
    backgroundColor: "#000000",
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Previous experience specific styles
  experienceButton: {
    width: "100%",
    height: 60,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  experienceButtonSelected: {
    backgroundColor: "#000000",
  },
  experienceButtonUnselected: {
    backgroundColor: "#F5F5F5",
  },
  experienceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  experienceIconContainerSelected: {
    backgroundColor: "#FFFFFF",
  },
  experienceIconContainerUnselected: {
    backgroundColor: "#FFFFFF",
  },
  experienceText: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 12,
  },
  experienceTextSelected: {
    color: "#FFFFFF",
  },
  experienceTextUnselected: {
    color: "#000000",
  },
  // Additional common styles
  pickerContainer: {
    gap: 16,
  },
  pickerLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  pickerValues: {
    gap: 8,
    width: "100%",
  },
  pickerValue: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  pickerValueSelected: {
    backgroundColor: "#E8E8E8",
  },
  pickerValueText: {
    fontSize: 16,
    color: "#666666",
  },
  pickerValueTextSelected: {
    color: "#000000",
    fontWeight: "600",
  },
  unitToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    gap: 12,
  },
  unitText: {
    fontSize: 16,
    color: "#666666",
  },
  unitTextActive: {
    color: "#000000",
    fontWeight: "600",
  },
  // ScrollPicker styles
  pickersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  pickerWrapper: {
    alignItems: "center",
    width: 100,
  },
  picker: {
    width: 240,
  },
  pickerItem: {
    fontSize: 15,
    color: "#CCCCCC",
    fontWeight: "400",
  },
  pickerItemSelected: {
    color: "#000000",
    fontWeight: "500",
  },
  label: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 8,
    fontWeight: "500",
  },
});

export default commonStyles;
