"use client";

import * as React from "react";

type CatalogHeroStat = {
  icon: React.ReactNode;
  label: React.ReactNode;
};

type CatalogHeroClasses = {
  root: string;
  top?: string;
  lead: string;
  eyebrow: string;
  title: string;
  description: string;
  stats: string;
  stat: string;
  titleRow?: string;
  titleMeta?: string;
};

type CatalogHeroProps = {
  classes: CatalogHeroClasses;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  titleMeta?: React.ReactNode;
  action?: React.ReactNode;
  stats?: CatalogHeroStat[];
};

function CatalogHero({
  classes,
  eyebrow,
  title,
  description,
  titleMeta,
  action,
  stats = [],
}: CatalogHeroProps) {
  return (
    <header className={classes.root}>
      <div className={classes.top}>
        <div className={classes.lead}>
          <div className={classes.eyebrow}>{eyebrow}</div>
          {titleMeta ? (
            <div className={classes.titleRow}>
              <h1 className={classes.title}>{title}</h1>
              <span className={classes.titleMeta}>{titleMeta}</span>
            </div>
          ) : (
            <h1 className={classes.title}>{title}</h1>
          )}
          <p className={classes.description}>{description}</p>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {stats.length > 0 ? (
        <div className={classes.stats}>
          {stats.map((stat, index) => (
            <div key={index} className={classes.stat}>
              {stat.icon}
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export { CatalogHero, type CatalogHeroClasses, type CatalogHeroStat };
