// styles/ui.ts
import { Colors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const ui = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        paddingVertical: 16,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        color: "#333",
    },
    card: {
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#f0f0f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
        marginBottom: 6,
    },
    input: {
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#eee",
        color: "#333",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    modalCard: {
        backgroundColor: "#fff",
        padding: 18,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
    },
});
