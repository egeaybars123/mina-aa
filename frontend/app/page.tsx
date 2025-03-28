'use client';

import { useState, useEffect } from 'react';
import { arrayBufferToStr, convertEcdsaAsn1Signature, uint8ArrayToBigInt, extractPublicKeyFromAttestation } from './utils';

export default function Home() {
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

  const [availableCredential, setAvailableCredential] = useState<PublicKeyCredential | null>(null);

  // Function to discover existing passkeys
  const discoverPasskeys = async () => {
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          userVerification: 'required',
        }
      }) as PublicKeyCredential;

      setAvailableCredential(credential);
    } catch (error) {
      console.error('No existing credentials found:', error);
      
    }
  };

  const handleCreatePasskeys = async () => {
    try {
      let credentialToUse = availableCredential;

      //todo: if block can be removed
      if (!credentialToUse) {
        // Create new credential if none exists
        const newCredential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: {
              name: 'Message Signing Demo',
              id: window.location.hostname
            },
            user: {
              id: new Uint8Array(16),
              name: 'user',
              displayName: 'User'
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 }, // ES256
              { type: 'public-key', alg: -257 } // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required'
            }
          }
        });
        // First cast to PublicKeyCredential, then access the response with the correct type
          const pkCred = newCredential as PublicKeyCredential;
          const attestationResponse = pkCred.response as AuthenticatorAttestationResponse;
          console.log("rEsponse: ", attestationResponse);
          console.log("Attestation object: ", attestationResponse.attestationObject);
          const parsedPubKey: any = extractPublicKeyFromAttestation(attestationResponse.attestationObject);
          console.log("Public Key: ", { x: uint8ArrayToBigInt(parsedPubKey.get(-2)), y: uint8ArrayToBigInt(parsedPubKey.get(-3)) })
          setAvailableCredential(pkCred);
      }
    } catch (error) {
      console.error('Error during signing:', error);
    }
  }

  const handleSign = async () => {
    try {
      let credentialToUse = availableCredential;

      if (!credentialToUse) {
        // Create new credential if none exists
        const newCredential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: {
              name: 'Message Signing Demo',
              id: window.location.hostname
            },
            user: {
              id: new Uint8Array(16),
              name: 'user',
              displayName: 'User'
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 }, // ES256
              { type: 'public-key', alg: -257 } // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required'
            }
          }
        });
        credentialToUse = newCredential as PublicKeyCredential;
        setAvailableCredential(credentialToUse);
      }

      // Convert the message to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      // Sign the message
      const signResult = await navigator.credentials.get({
        publicKey: {
          challenge: data,
          allowCredentials: [{
            id: credentialToUse.rawId,
            type: 'public-key'
          }],
          userVerification: 'required'
        }
      });

      if (signResult) {
        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array((signResult as any).response.signature)));
        setSignature(signatureBase64);
      }
    } catch (error) {
      console.error('Error during signing:', error);
    }
  };

  const handleVerify = async () => {
    try {
      // In a real application, you would verify the signature cryptographically
      // For this demo, we'll just check if we have both message and signature
      setVerificationResult(Boolean(message && signature));
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationResult(false);
    }
  };

  const formatCredentialJSON = (credential: PublicKeyCredential) => {
    const credJSON = credential.toJSON();
    return JSON.stringify(credJSON, null, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
              Passkey Message Signing
            </h1>

            <div className="max-w-2xl mx-auto space-y-8">
              {/* Discover Passkeys Button */}
              {!availableCredential && (
                <div className="flex justify-center">
                  <button
                    onClick={discoverPasskeys}
                    className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105 font-medium text-lg"
                  >
                    Discover Existing Passkeys
                  </button>
                </div>
              )}

              {!availableCredential && (
                <div className="flex justify-center">
                  <button
                    onClick={handleCreatePasskeys}
                    className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105 font-medium text-lg"
                  >
                    Create New Passkey
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div className="space-y-4">
                <label htmlFor="message" className="block text-lg font-medium text-gray-700">
                  Enter your message:
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg min-h-[120px] focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                  placeholder="Type your message here..."
                />
              </div>

              {/* Sign Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSign}
                  disabled={!message}
                  className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium text-lg"
                >
                  {availableCredential ? 'Sign Message' : 'Create New Passkey & Sign'}
                </button>
              </div>

              {/* Public Key Display */}
              {availableCredential && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-700">Your Passkey Details:</h3>
                  </div>
                  <pre className="p-4 text-sm font-mono bg-gray-50 overflow-x-auto">
                    {JSON.stringify(availableCredential.toJSON(), null, 2)}
                  </pre>
                </div>
              )}

              {/* Signature and Verification */}
              {signature && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-700">Signature:</h3>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-sm font-mono break-all">{signature}</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleVerify}
                      className="bg-purple-500 text-white px-8 py-3 rounded-lg hover:bg-purple-600 transition-all transform hover:scale-105 font-medium text-lg"
                    >
                      Verify Signature
                    </button>
                  </div>

                  {verificationResult !== null && (
                    <div className={`p-4 rounded-lg text-center text-lg font-medium ${
                      verificationResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {verificationResult ? 'Signature verified successfully! ✓' : 'Signature verification failed! ✗'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}