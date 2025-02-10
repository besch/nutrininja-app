import { StyleSheet } from "react-native";

export const wheelPickerStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#F5F5F5",
    borderRadius: 2,
    marginVertical: 20,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000",
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },
  pickerWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  picker: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "transparent",
  },
  pickerItem: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#666",
  },
  pickerSelectedItem: {
    color: "#000",
    fontWeight: "500",
  },
  unitToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  unitText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: "#666",
  },
  unitTextActive: {
    color: "#000",
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  centeredTitle: {
    textAlign: "center",
  },
  widePickerWrapper: {
    width: "80%",
  },
  itemText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
  itemContainer: {
    backgroundColor: '#F5F5F5',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pickerContainer: {
    position: 'relative',
    height: 260,
  },
  placeholderPicker: {
    flex: 1,
  },
  placeholder: {
    width: '100%',
    height: 260,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginTop: 8,
  }
});

export default wheelPickerStyles;
