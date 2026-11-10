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
  title: string;
  stats: string;
  stat: string;
  titleRow?: string;
  titleMeta?: string;
};

type CatalogHeroProps = {
  classes: CatalogHeroClasses;
  title: React.ReactNode;
  titleMeta?: React.ReactNode;
  action?: React.ReactNode;
  stats?: CatalogHeroStat[];
};

function CatalogHero({
  classes,
  title,
  titleMeta,
  action,
  stats = [],
}: CatalogHeroProps) {
  return (
    <header className={classes.root}>
      <div className={classes.top}>
        <div className={classes.lead}>
          {titleMeta ? (
            <div className={classes.titleRow}>
              <h1 className={classes.title}>{title}</h1>
              <span className={classes.titleMeta}>{titleMeta}</span>
            </div>
          ) : (
            <h1 className={classes.title}>{title}</h1>
          )}
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
