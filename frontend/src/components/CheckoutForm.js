// src/components/CheckoutForm.js
import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";

export default function CheckoutForm({ clientSecret, orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();             // <-- añadimos navigate
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setError(null);

    const card = elements.getElement(CardElement);
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card } }
      );

      if (stripeError) {
        console.error("Stripe Error:", stripeError);
        setError(stripeError.message);
      } else if (paymentIntent.status === "succeeded" ||
                 (stripeError?.code === "payment_intent_unexpected_state" &&
                  stripeError.payment_intent?.status === "succeeded")) {
        // ← aquí PASAMOS el orderId en state
        navigate("/order-confirmation", { state: { orderId } });
      } else {
        setError(`Estado inesperado: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error("Error confirmando el pago:", err);
      setError(err.message || "Se ha producido un error de procesamiento.");
    }

    setProcessing(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-6"
    >
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Pago Seguro
      </h2>

      <div>
        <label
          htmlFor="card-element"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Detalles de la tarjeta
        </label>
        <div className="p-3 border border-gray-300 rounded-md">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#374151",
                  "::placeholder": { color: "#9CA3AF" },
                },
                invalid: { color: "#EF4444" },
              },
            }}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || !clientSecret || processing}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {processing ? "Procesando…" : "Pagar"}
      </button>
    </form>
  );
}
