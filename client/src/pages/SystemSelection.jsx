import { Box, SimpleGrid, Text, Button, VStack, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaProjectDiagram } from "react-icons/fa";
import { SiWebmoney } from "react-icons/si";
import { useEffect, useRef } from "react";
import ParticleCanvas from "../components/animation";

// function ParticleCanvas() {
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     let animationId;

//     const resize = () => {
//       canvas.width = canvas.offsetWidth;
//       canvas.height = canvas.offsetHeight;
//     };
//     resize();
//     window.addEventListener("resize", resize);

//     const PARTICLE_COUNT = 80;
//     const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
//       x: Math.random() * canvas.width,
//       y: Math.random() * canvas.height,
//       r: Math.random() * 2.5 + 1,
//       dx: (Math.random() - 0.5) * 0.6,
//       dy: (Math.random() - 0.5) * 0.6,
//       alpha: Math.random() * 0.5 + 0.2,
//     }));

//     const draw = () => {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // Draw connection lines
//       for (let i = 0; i < particles.length; i++) {
//         for (let j = i + 1; j < particles.length; j++) {
//           const dx = particles[i].x - particles[j].x;
//           const dy = particles[i].y - particles[j].y;
//           const dist = Math.sqrt(dx * dx + dy * dy);
//           if (dist < 120) {
//             ctx.beginPath();
//             ctx.strokeStyle = `rgba(49, 130, 206, ${0.15 * (1 - dist / 120)})`;
//             ctx.lineWidth = 0.8;
//             ctx.moveTo(particles[i].x, particles[i].y);
//             ctx.lineTo(particles[j].x, particles[j].y);
//             ctx.stroke();
//           }
//         }
//       }

//       // Draw particles
//       particles.forEach((p) => {
//         ctx.beginPath();
//         ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
//         ctx.fillStyle = `rgba(49, 130, 206, ${p.alpha})`;
//         ctx.fill();

//         p.x += p.dx;
//         p.y += p.dy;

//         if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
//         if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
//       });

//       animationId = requestAnimationFrame(draw);
//     };

//     draw();

//     return () => {
//       cancelAnimationFrame(animationId);
//       window.removeEventListener("resize", resize);
//     };
//   }, []);

//   return (
//     <canvas
//       ref={canvasRef}
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//         width: "100%",
//         height: "100%",
//         pointerEvents: "none",
//       }}
//     />
//   );
// }

export default function SystemSelection() {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.700");
  const pageBg = useColorModeValue("#eef2f7", "gray.900");

  const handleSelectSystem = (system) => {
    localStorage.setItem("selectedSystem", system);
    if (system === "cost") navigate("/dashboard");
    else if (system === "project") navigate("/project-viewer");
  };

  return (
    <Box
      position="relative"
      minH="100vh"
      bg={pageBg}
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {/* Animated particle background */}
      <ParticleCanvas />

      {/* Page content */}
      <Box position="relative" zIndex={1} p={10} w="full" maxW="900px">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" mb={2}>
          SELECT SYSTEM
        </Text>
        <Text textAlign="center" color="gray.500" mb={10}>
          Choose which system you want to access
        </Text>

        <SimpleGrid columns={[1, 2, 2]} spacing={8}>
          {/* Cost Tracking System */}
          <Box
            bg={cardBg}
            p={20}
            borderRadius="xl"
            boxShadow="lg"
            textAlign="center"
            _hover={{ transform: "scale(1.03)", boxShadow: "xl" }}
            transition="0.2s"
          >
            <VStack spacing={4}>
              <SiWebmoney size={60} color="#3182ce" />
              <Text fontSize="xl" fontWeight="bold">
                Cost Tracking System
              </Text>
              <Text color="gray.500">
                Manage job, labor, materials and costs
              </Text>
              <Button
                colorScheme="blue"
                width="full"
                onClick={() => handleSelectSystem("cost")}
              >
                Enter System
              </Button>
            </VStack>
          </Box>

          {/* Project Viewer */}
          <Box
            bg={cardBg}
            p={20}
            borderRadius="xl"
            boxShadow="lg"
            textAlign="center"
            _hover={{ transform: "scale(1.03)", boxShadow: "xl" }}
            transition="0.2s"
          >
            <VStack spacing={4}>
              <FaProjectDiagram size={60} color="#3182ce" />
              <Text fontSize="xl" fontWeight="bold">
                Project Viewer
              </Text>
              <Text color="gray.500">
                View projects and reports only
              </Text>
              <Button
                colorScheme="blue"
                width="full"
                onClick={() => handleSelectSystem("project")}
              >
                Enter System
              </Button>
            </VStack>
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}