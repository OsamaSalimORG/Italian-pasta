export const config = {
  googleSheets: {
    spreadsheetId: "1LEsjxS81OfFJVdZ6zVc9a0xlTXDOjFA-el9d8IqKglc",
    apiKey: "AIzaSyBwjRABXS_K3qAaPPef54jb478SAA-3_Bk",
    sheetName: "Sheet1",
    discountSheetName: "discount",
    phoneSheetName: "Phone_number",
  },
  googleDrive: {
    imageUrlFormat: "https://drive.google.com/uc?export=view&id={FILE_ID}",
    fallbackFormat: "https://lh3.googleusercontent.com/d/{FILE_ID}",
  },
  cache: {
    menuDataTTL: 5 * 60 * 1000,
  },
  ui: {
    placeholderImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=75",
  },
} as const;
