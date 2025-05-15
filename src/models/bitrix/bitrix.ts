import "dotenv/config";
import axios from "axios";

const baseUrl = `https://bitrix24.planarchel.ru/rest/${process.env.BITRIX_USER_ID}/${process.env.BITRIX_AUTH_KEY}`;

export const notify = async (
  userId: number,
  message: string,
): Promise<{ result: string }> => {
  const result = await axios.post(
    `${baseUrl}/im.notify.personal.add.json`,
    null,
    {
      params: {
        user_id: userId,
        message: message,
      },
    },
  );
  return result.data;
};
