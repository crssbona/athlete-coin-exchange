import React from 'react';

interface CosmicAvatarProps {
    src: string;
    verified?: boolean;
    className?: string;
    backgroundColor?: string;
}

export const CosmicAvatar = ({
    src,
    verified = false,
    className = "",
    backgroundColor = 'hsl(var(--background))'
}: CosmicAvatarProps) => {

    // SE NÃO FOR VERIFICADO: Retorna a imagem estática clássica
    if (!verified) {
        return (
            <img
                src={src}
                alt="Avatar Perfil"
                className={`rounded-full object-cover border-4 border-muted shadow-sm ${className}`}
            />
        );
    }

    // SE FOR VERIFICADO: Carrega o CSS e a Animação Cósmica
    const customStyles = `
    @keyframes ring-chaotic {
        0%   { transform: rotate(0deg); border-radius: 50%; }
        20%  { transform: rotate(45deg); border-radius: 20% 80% 30% 70% / 60% 30% 70% 40%; }
        25%  { transform: rotate(180deg); border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
        60%  { transform: rotate(210deg); border-radius: 40% 60% 70% 30% / 50% 60% 30% 60%; }
        65%  { transform: rotate(340deg); border-radius: 20% 80% 20% 80% / 80% 20% 80% 20%; }
        100% { transform: rotate(360deg); border-radius: 50%; }
    }

    @keyframes img-chaotic {
        0%   { border-radius: 50%; }
        15%  { border-radius: 80% 20% 80% 20% / 20% 80% 20% 80%; }
        20%  { border-radius: 30% 70% 60% 40% / 50% 60% 40% 50%; }
        55%  { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        60%  { border-radius: 40% 60% 50% 50% / 30% 60% 40% 70%; }
        100% { border-radius: 50%; }
    }

    .avatar-sincope {
        position: relative;
        transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        display: inline-block;
    }

    .avatar-sincope:hover {
        transform: scale(1.05);
    }

    .avatar-sincope::before {
        content: '';
        position: absolute;
        inset: -4px; 
        padding: 2px;
        background: conic-gradient(#a62681, #2d0a45, #420f65, #a62681);
        z-index: 1; 
        pointer-events: none;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        animation: ring-chaotic 8s infinite ease-in-out;
    }

    .avatar-sincope img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 2; 
        filter: grayscale(10%) contrast(110%);
        transition: filter 0.5s ease;
        animation: img-chaotic 11s infinite ease-in-out;
    }

    .avatar-sincope:hover img {
        filter: grayscale(0%) contrast(105%);
    }

    .avatar-badge {
        position: absolute;
        bottom: 5%;
        right: 5%;
        width: 25%;
        height: 25%;
        min-width: 24px;
        min-height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #a62681;
        color: #ffffff;
        z-index: 3;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 3px solid var(--bg-color, #050505);
    }

    .avatar-sincope:hover .avatar-badge {
        transform: scale(1.15) rotate(-5deg);
    }

    .avatar-badge svg {
        width: 60%;
        height: 60%;
    }
  `;

    return (
        <>
            <style>{customStyles}</style>
            <div
                className={`avatar-sincope ${className}`}
                style={{ '--bg-color': backgroundColor } as React.CSSProperties}
            >
                <img src={src} alt="Avatar Perfil" />

                <div className="avatar-badge" title="Perfil Verificado">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </>
    );
};