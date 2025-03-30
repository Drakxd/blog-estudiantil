import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Acerca del Blog Estudiantil</h1>
            
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                Bienvenido al Blog Estudiantil, un espacio dedicado a compartir conocimientos y recursos 
                académicos en diversas materias. Este blog fue creado con el objetivo de organizar
                contenido educativo de calidad para estudiantes.
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Nuestro Propósito</h2>
              <p className="text-gray-700 mb-4">
                Este blog tiene como propósito principal servir como una plataforma educativa donde
                se comparta contenido académico de calidad en distintas áreas del conocimiento, 
                especialmente enfocado en las siguientes materias:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                <li>Tecnología</li>
                <li>Informática</li>
                <li>Marketing</li>
                <li>Legislación Laboral</li>
                <li>Legislación Comercial</li>
                <li>Administración</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Características</h2>
              <p className="text-gray-700 mb-4">
                El Blog Estudiantil ofrece las siguientes características:
              </p>

              <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                <li>Contenido multimedia: artículos, imágenes, videos y documentos</li>
                <li>Organización por materias académicas</li>
                <li>Interfaz intuitiva y fácil navegación</li>
                <li>Contenido actualizado regularmente</li>
                <li>Recursos descargables para estudiantes</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Administración</h2>
              <p className="text-gray-700 mb-6">
                Este blog es administrado por un único usuario que se encarga de crear y publicar
                todo el contenido. Solo el administrador tiene permisos para editar, agregar o eliminar
                publicaciones, garantizando así la calidad y consistencia del material publicado.
              </p>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-8">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">Contacto</h3>
                <p className="text-blue-700">
                  Si tienes preguntas, sugerencias o deseas contribuir con ideas para nuevos contenidos,
                  no dudes en contactar al administrador a través de los enlaces de redes sociales
                  que aparecen en el pie de página.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;