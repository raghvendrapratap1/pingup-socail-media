import toast from "react-hot-toast";

const httpAction = async (data) => {
  try {
    const response = await fetch(data.url, {
      method: data.method || "GET",
      body: data.body ? JSON.stringify(data.body) : null,
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ cookie send & receive ke liye
    });

    let result;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // Fallback: try to read text and wrap it
      const text = await response.text();
      result = { message: text };
    }

    if (!response.ok) throw new Error(result?.message || "Something went wrong");
    return result;
  } catch (error) {
    toast.error(error.message || "Something went wrong");
    return null;
  }
};

export default httpAction;
