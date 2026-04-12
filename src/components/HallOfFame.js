import React from 'react';

const HallOfFame = () => {
    const champions = [
        {
            name: 'Casey Capetola',
            award: 'MVP 2023',
            description: 'A respected leader whose performance helped define the league\'s community spirit.',
            image: 'original-files/images/caseyc.jpg'
        },
        {
            name: 'Aidan O\'Neil',
            award: 'MVP 2024',
            description: 'Dominant on both ends of the court; known for clutch plays and consistent excellence.',
            image: 'original-files/images/aidano.jpg'
        },
        {
            name: 'Tyler Wassel',
            award: 'MVP 2025',
            description: 'Outstanding competitor and sportsman, a key influence in growing the league and raising the bar.',
            image: 'original-files/images/tylerw.jpg'
        }
    ];

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Hall of Fame</h1>
                    <p>League legends and all-time greats.</p>
                </div>
            </header>

            <main className="container my-5">
                <div className="row row-cols-1 row-cols-md-3 g-4">
                    {champions.map((champ, idx) => (
                        <div className="col" key={idx}>
                            <div className="card shadow-sm">
                                <img src={champ.image} className="card-img-top" alt={champ.name} />
                                <div className="card-body">
                                    <h5 className="card-title">{champ.name}</h5>
                                    <p className="text-muted">{champ.award}</p>
                                    <p>{champ.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default HallOfFame;
