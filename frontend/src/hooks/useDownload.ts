import JSZip from "jszip";

export interface ImageLink {
    url: string;
    name: string;
}

const useDownloadImages = () => {
  async function handleZip(zipTitle: string, images: ImageLink[]) {
    const zip = new JSZip();

    // Add Images to the zip file
    for (let i = 0; i < images.length; i++) {
      const response = await fetch(images[i].url);
      const blob = await response.blob();
      zip.file(`${images[i].name}.jpeg`, blob);
    }

    // Generate the zip file
    const zipData = await zip.generateAsync({
      type: "blob",
      streamFiles: true,
    });

    // Create a download link for the zip file
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(zipData);
    link.download = `${zipTitle}_images.zip`;
    link.click();
  }

  return { handleZip };
};

export { useDownloadImages };
