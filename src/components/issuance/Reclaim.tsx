import {
  ClaimCreationType,
  ReclaimProofRequest,
  type Proof,
} from "@reclaimprotocol/js-sdk";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

const APP_ID = import.meta.env.VITE_RECLAIM_APP_ID;
const APP_SECRET = import.meta.env.VITE_RECLAIM_APP_SECRET;
const PROVIDERS = [
  {
    name: "GitHub UserName",
    providerId: "6d3f6753-7ee6-49ee-a545-62f1b1822ae5",
    logoUrl:
      "https://devtool-images.s3.ap-south-1.amazonaws.com/http-provider-brand-logos/github.com-82dc77d1-d420-4093-af25-a47c81531a8d.png",
  },
  {
    name: "Gmail Account",
    providerId: "f9f383fd-32d9-4c54-942f-5e9fda349762",
    logoUrl:
      "https://devtool-images.s3.ap-south-1.amazonaws.com/http-provider-brand-logos/google.com-4b9f85b5-17f3-44bc-bc19-254b4746ae1a.png",
  },
  {
    name: "LinkedIn - User Profile Details",
    providerId: "a9f1063c-06b7-476a-8410-9ff6e427e637",
    logoUrl:
      "https://devtool-images.s3.ap-south-1.amazonaws.com/http-provider-brand-logos/linkedin.com-d305300b-0b53-4b23-b0a3-f51171c11257.png",
  },
  {
    name: "Linkedin User Profile v2",
    providerId: "b16c6781-4411-4bde-b1e6-c041df573f96",
    logoUrl:
      "https://devtool-images.s3.ap-south-1.amazonaws.com/http-provider-brand-logos/linkedin.com-456d00ad-5eb8-4e4c-a6d2-9da22681d432.png",
  },
  {
    name: "Binance KYC Level",
    providerId: "2b22db5c-78d9-4d82-84f0-a9e0a4ed0470",
    logoUrl:
      "https://devtool-images.s3.ap-south-1.amazonaws.com/http-provider-brand-logos/binance.com-00a58378-085e-4a47-b651-1967548a06b3.png",
  },
  {
    name: "Twitter User Profile",
    providerId: "e6fe962d-8b4e-4ce5-abcc-3d21c88bd64a",
    logoUrl:
      "https://devtool-images.s3.ap-south-1.amazonaws.com/http-provider-brand-logos/x.com-106c6555-07ee-4337-9fbb-9c27c461af31.png",
  },
  {
    name: "Uber UID",
    providerId: "81dd6dc5-b50d-4276-b4cb-dc67bdcf919f",
    logoUrl:
      "https://devtool-images.s3.ap-south-1.amazonaws.com/http-provider-brand-logos/uber.com-581dfa43-409a-4651-89da-d0ed8514beba.png",
  },
];

export const Reclaim = ({
  onSuccess,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (extractedParameters: any) => void;
}) => {
  const [ready, setReady] = useState(false);
  const [proof, setProof] = useState<Proof | null>(null);
  const [reclaimProofRequest, setReclaimProofRequest] =
    useState<ReclaimProofRequest | null>(null);
  const [requestUrl, setRequestUrl] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<
    (typeof PROVIDERS)[0] | null
  >(null);

  const resetState = () => {
    setSelectedProvider(null);
    setReclaimProofRequest(null);
    setRequestUrl("");
    setProof(null);
    setReady(false);
  };

  useEffect(() => {
    if (!selectedProvider) return;
    async function initializeReclaim() {
      const proofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        selectedProvider ? selectedProvider.providerId : "",
        {
          useAppClip: false,
          log: true,
          useBrowserExtension: true,
        }
      );

      setReclaimProofRequest(proofRequest);
    }
    initializeReclaim();
  }, [selectedProvider]);

  async function generateVerificationRequest() {
    if (!reclaimProofRequest) {
      console.error("Reclaim Proof Request not initialized");
      return;
    }
    reclaimProofRequest.setClaimCreationType(ClaimCreationType.ON_ME_CHAIN);
    const url = await reclaimProofRequest.getRequestUrl();
    setRequestUrl(url);
    await reclaimProofRequest.startSession({
      onSuccess: (proof) => {
        setReady(true);
        if (proof && typeof proof === "object" && !Array.isArray(proof)) {
          setProof(proof as Proof);

          const extractedParameters = JSON.parse(
            proof.claimData.context
          ).extractedParameters;

          if (extractedParameters) {
            onSuccess(extractedParameters);
          } else {
            console.error("No extracted parameters found");
          }
        } else {
          console.error("Invalid proof received");
        }
      },
      onError: (error) => {
        console.error("Verification failed", error);
      },
    });
  }

  return (
    <div className="mb-6 sm:mb-8">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-4">
        Reclaim SDK
      </h3>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start">
          {!selectedProvider && (
            <div className="w-full">
              <div className="mb-4 font-semibold">Choose a Provider</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.providerId}
                    className="flex items-center border rounded p-1 hover:bg-gray-50 w-full text-xs"
                    style={{ minHeight: 32 }}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <img
                      src={provider.logoUrl}
                      alt={provider.name}
                      className="w-6 h-6 mr-1 rounded"
                    />
                    <span>{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedProvider && !requestUrl && (
            <button
              className="inline-flex items-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors cursor-pointer"
              onClick={generateVerificationRequest}
              disabled={!reclaimProofRequest}
            >
              Create Claim QR Code
            </button>
          )}
          {requestUrl && (
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center mt-2">
                <QRCodeSVG value={requestUrl} size={180} />
                <div className="text-xs text-gray-400 mt-2 break-all text-center max-w-xs">
                  Scan this QR code with the Reclaim app
                </div>
              </div>
              <div className="mt-4 w-full flex justify-center">
                <div className="max-w-xs w-full flex justify-center">
                  <button
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
                    onClick={resetState}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
          {ready && (
            <>
              <div
                className="mt-6 w-full overflow-x-auto bg-gray-100 p-4 rounded-md text-xs"
                style={{
                  maxHeight: 300,
                  overflowX: "auto",
                  overflowY: "auto",
                }}
              >
                <div className="font-semibold mb-1 text-gray-700">Proof:</div>
                <pre
                  className="whitespace-pre break-all"
                  style={{
                    maxHeight: 220,
                    overflowX: "auto",
                    overflowY: "auto",
                  }}
                >
                  {JSON.stringify(proof, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
