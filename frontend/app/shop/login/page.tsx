"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getApiErrorMessage, shopAuthApi } from "../../lib/api";
import { useSession } from "../hooks/useSession";

export default function Login() {
  const router = useRouter();
  const { saveSession } = useSession();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [primerNombre, setPrimerNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [correo, setCorreo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        const session = await shopAuthApi.register({
          CLI_Primer_Nombre: primerNombre,
          CLI_Primer_Apellido: primerApellido,
          CLI_Correo_Electronico: correo,
          username: username || correo,
          password,
        });
        saveSession(session.token, session.user);
      } else {
        const session = await shopAuthApi.login({ username, password });
        saveSession(session.token, session.user);
      }

      router.push("/shop/cuenta");
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center text-black">

      {/* BACKGROUND */}
      <Image
        unoptimized
        src="https://images.unsplash.com/photo-1567016432779-094069958ea5"
        alt="fondo muebles"
        fill
        className="object-cover"
      />

      {/* OVERLAY (más suave) */}
      <div className="absolute inset-0 bg-black/40" />

      {/* CARD */}
      <div className="relative z-10 bg-white w-full max-w-md p-10 rounded-xl shadow-2xl text-black">

        <h1 className="text-2xl font-bold mb-6 text-center text-black">
          {isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </h1>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {isRegister && (
            <>
              <div>
                <label className="text-sm font-medium text-black">
                  Primer nombre
                </label>
                <input
                  type="text"
                  value={primerNombre}
                  onChange={(event) => setPrimerNombre(event.target.value)}
                  required
                  className="w-full border border-gray-300 mt-2 p-3 text-black placeholder-gray-400 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-black">
                  Primer apellido
                </label>
                <input
                  type="text"
                  value={primerApellido}
                  onChange={(event) => setPrimerApellido(event.target.value)}
                  required
                  className="w-full border border-gray-300 mt-2 p-3 text-black placeholder-gray-400 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-black">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(event) => {
                    setCorreo(event.target.value);
                    if (!username) setUsername(event.target.value);
                  }}
                  required
                  className="w-full border border-gray-300 mt-2 p-3 text-black placeholder-gray-400 focus:outline-none focus:border-black"
                />
              </div>
            </>
          )}

          {/* USUARIO */}
          <div>
            <label className="text-sm font-medium text-black">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ingresa tu usuario"
              required
              className="w-full border border-gray-300 mt-2 p-3 text-black placeholder-gray-400 focus:outline-none focus:border-black"
            />
          </div>

          {/* CONTRASEÑA */}
          <div>
            <label className="text-sm font-medium text-black">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              className="w-full border border-gray-300 mt-2 p-3 text-black placeholder-gray-400 focus:outline-none focus:border-black"
            />
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* BOTÓN */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 font-semibold hover:bg-gray-800 transition"
          >
            {loading ? "PROCESANDO..." : isRegister ? "CREAR CUENTA" : "INGRESAR"}
          </button>

        </form>

        {/* CREAR CUENTA */}
        <div className="text-center mt-6 text-sm text-gray-700">
          {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => setIsRegister((prev) => !prev)}
            className="text-black font-semibold hover:underline"
          >
            {isRegister ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </div>

      </div>

    </main>
  );
}