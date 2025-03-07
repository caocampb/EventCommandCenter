import { EmailSignIn } from "@/components/email-signin";
import { GoogleSignin } from "@/components/google-signin";
import Image from "next/image";

export const metadata = {
  title: "Login",
};

export default function Page() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-6 w-96">
        <Image src="/logo.png" alt="logo" width={350} height={350} />
        
        <div className="w-full space-y-4">
          <EmailSignIn />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
          
          <GoogleSignin />
        </div>
      </div>
    </div>
  );
}
