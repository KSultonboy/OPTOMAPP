// utils/pdfGenerator.ts
import { Product, Transaction } from "@/context/AppContext";
import { buildReportHtml } from "@/utils/reportHtml";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const generateReport = async (products: Product[], transactions: Transaction[]) => {
  try {
    const html = buildReportHtml(products, transactions);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};
