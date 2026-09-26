"""Temperature-only diagnostic residuals. Raw inputs are read-only and hash-checked.

Run: python temperature_comparison_engine.py --config comparison_config.json
Tests use synthetic arrays only; synthetic data never enter the real outputs.
"""
from __future__ import annotations
import argparse, collections, csv, datetime as dt, hashlib, importlib.metadata
import json, math, pathlib, platform
import numpy as np


def numeric(values, fill_values=()):
    """Preserve a mask, exclude explicit fill sentinels, and return float/NaN."""
    a = np.ma.asarray(values, dtype=float).filled(np.nan).copy()
    for fill in fill_values:
        a[a == fill] = np.nan
    a[~np.isfinite(a)] = np.nan
    return a


def haversine_km(lon1, lat1, lon2, lat2, radius_km=6371.0088):
    lon1, lat1, lon2, lat2 = map(np.radians, (lon1, lat1, lon2, lat2))
    a = np.sin((lat2-lat1)/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin((lon2-lon1)/2)**2
    return radius_km * 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


def interpolate_no_extrapolation(depths, temperature, target_depths, fill_values=()):
    """Linear interpolation only inside an adjacent pair of valid model levels.

    A missing interior model value invalidates either adjoining segment. It is
    never removed and bridged. Exact valid model-level matches are allowed.
    """
    z = numeric(depths)
    t = numeric(temperature, fill_values)
    q = numeric(target_depths)
    if z.ndim != 1 or t.shape != z.shape or len(z) < 2:
        raise ValueError('Need matching one-dimensional arrays with >=2 model levels')
    if not np.all(np.isfinite(z)) or not np.all(np.diff(z) > 0):
        raise ValueError('Model depths must be finite and strictly ascending')
    result = np.full(q.shape, np.nan)
    for index in np.ndindex(q.shape):
        v = q[index]
        if not np.isfinite(v) or v < z[0] or v > z[-1]:
            continue
        hi = int(np.searchsorted(z, v))
        if hi < len(z) and v == z[hi]:
            result[index] = t[hi]
        elif 0 < hi < len(z) and np.isfinite(t[hi-1]) and np.isfinite(t[hi]):
            result[index] = t[hi-1] + (v-z[hi-1])/(z[hi]-z[hi-1]) * (t[hi]-t[hi-1])
    return result


def calculate_metrics(observed, model, accepted=None, fill_values=()):
    obs, mod = numeric(observed, fill_values), numeric(model, fill_values)
    if obs.shape != mod.shape:
        raise ValueError('Observation/model shape mismatch')
    valid = np.isfinite(obs) & np.isfinite(mod)
    if accepted is not None:
        valid &= np.asarray(accepted, dtype=bool)
    bias = mod[valid] - obs[valid]
    if not len(bias):
        raise ValueError('No accepted matched temperatures')
    return {'matched_level_count': int(len(bias)),
            'mean_bias_celsius': float(np.mean(bias)),
            'mae_celsius': float(np.mean(abs(bias))),
            'rmse_celsius': float(np.sqrt(np.mean(bias**2))),
            'maximum_absolute_error_celsius': float(np.max(abs(bias)))}


def qc_accepts(profile, level, accepted=('1',)):
    required = [profile.get('position_qc'), profile.get('time_qc'),
                level.get('PRES_ADJUSTED_QC'), level.get('TEMP_ADJUSTED_QC'),
                level.get('PSAL_ADJUSTED_QC')]
    return all(str(x) in accepted for x in required)


def nearest_valid_cell(lon, lat, longitudes, latitudes, depths, cube,
                       targets, max_distance_km=10, radius_km=6371.0088):
    if not (min(longitudes) <= lon <= max(longitudes) and min(latitudes) <= lat <= max(latitudes)):
        raise ValueError('Observation outside model geographic coverage')
    xx, yy = np.meshgrid(longitudes, latitudes)
    distances = haversine_km(lon, lat, xx, yy, radius_km)
    cube = numeric(cube)
    for flat in np.argsort(distances, axis=None, kind='stable'):
        iy, ix = np.unravel_index(flat, distances.shape)
        distance = float(distances[iy, ix])
        if distance > max_distance_km:
            break
        col = cube[:, iy, ix]
        if np.isfinite(col).sum() < 2:
            continue
        interpolated = interpolate_no_extrapolation(depths, col, targets)
        if np.isfinite(interpolated).any():
            return int(iy), int(ix), distance, col
    raise ValueError('No valid ocean cell within configured spatial limit')


def parse_time(value):
    return dt.datetime.fromisoformat(value.replace('Z', '+00:00'))


def time_offsets(observation, encoded_model, start, end, midpoint):
    obs = parse_time(observation)
    if not parse_time(start) <= obs < parse_time(end):
        raise ValueError('Observation outside documented daily averaging interval')
    return ((obs-parse_time(encoded_model)).total_seconds()/3600,
            (obs-parse_time(midpoint)).total_seconds()/3600)


def ranking_key(summary):
    return (-summary['matched_level_count'], abs(summary['time_offset_hours']),
            summary['spatial_distance_km'], summary['rmse_celsius'], summary['profile_id'])


def sha256(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


def write_json(path, value):
    pathlib.Path(path).write_text(json.dumps(value, indent=2, allow_nan=False), encoding='utf8')


def write_csv(path, rows):
    with pathlib.Path(path).open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def scalar(v):
    return None if np.ma.is_masked(v) else float(v)


def qc_string(v):
    if np.ma.is_masked(v):
        return ''
    v = np.asarray(v).item()
    return v.decode().strip() if isinstance(v, bytes) else str(v).strip()


def figures(out, summary, rows, z, model_column, grid_lon, grid_lat):
    import os, tempfile
    os.environ.setdefault('MPLCONFIGDIR',str(pathlib.Path(tempfile.gettempdir())/'oceantwin-matplotlib-cache'))
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.ticker import FuncFormatter
    plt.rcParams.update({'font.family':'DejaVu Sans', 'font.size':12,
                         'axes.spines.top':False, 'axes.spines.right':False,
                         'axes.labelcolor':'#24374b', 'text.color':'#24374b',
                         'axes.titleweight':'bold', 'savefig.facecolor':'white'})
    teal, orange, navy = '#007f8b', '#ca6d18', '#19364f'
    stem = out/f"profile_{summary['file_id']}"
    depths = [r['observation_depth_m'] for r in rows]
    obs = [r['observed_temperature'] for r in rows]
    model = [r['model_temperature_interpolated'] for r in rows]
    bias = [r['signed_bias_celsius'] for r in rows]
    subtitle = (f"{summary['profile_id']}  |  Argo {summary['observation_time_utc'][11:19]} UTC, 02 Jan 2024\n"
                f"Model 02 Jan 2024 daily mean  |  {summary['spatial_distance_km']:.3f} km  |  "
                f"Δt obs − stored time {summary['time_offset_hours']:+.3f} h")
    footer = ('Model–observation diagnostic comparison • SIH26067 · The Optimizers\n'
              'Potential temperature at 0 dbar; Argo QC 1 only. Reanalysis is not independent validation.')
    fig, ax = plt.subplots(figsize=(9.5,8))
    fig.subplots_adjust(top=.80,bottom=.16,left=.13,right=.96)
    fig.suptitle('Observed versus model temperature',x=.13,y=.97,ha='left',fontsize=21,color=navy)
    fig.text(.13,.865,subtitle,fontsize=10.5,linespacing=1.7)
    ax.plot(model_column,z,color=teal,alpha=.35,lw=1,linestyle='--',label='_nolegend_')
    ax.plot(model,depths,color=teal,lw=2.2,label='Copernicus model')
    ax.plot(obs,depths,color=orange,lw=1.6,marker='o',ms=3.5,label='Argo observation')
    ax.set(xlabel='Temperature (°C)',ylabel='Depth (m)',ylim=(max(z)+8,0))
    ax.grid(alpha=.18);ax.legend(loc='lower right',frameon=True)
    ax.text(.03,.82,f"n = {len(rows)}\nMAE {summary['mae_celsius']:.3f} °C\nRMSE {summary['rmse_celsius']:.3f} °C",transform=ax.transAxes,va='top',
            bbox={'boxstyle':'round,pad=.5','facecolor':'white','edgecolor':'#d9e3e8'},fontsize=11)
    fig.text(.13,.035,footer,fontsize=9,linespacing=1.5)
    fig.savefig(str(stem)+'_observed_vs_model.png',dpi=300);plt.close(fig)
    fig,ax=plt.subplots(figsize=(9.5,8));fig.subplots_adjust(top=.80,bottom=.16,left=.13,right=.96)
    fig.suptitle('Temperature bias by depth',x=.13,y=.97,ha='left',fontsize=21,color=navy)
    fig.text(.13,.865,subtitle,fontsize=10.5,linespacing=1.7)
    extent=max(.15,max(abs(x) for x in bias)*1.30)
    ax.axvspan(-extent,0,color='#e5f1fa',alpha=.8);ax.axvspan(0,extent,color='#fff0df',alpha=.8)
    ax.axvline(0,color=navy,lw=1.2,linestyle='--');ax.plot(bias,depths,color=teal,lw=1.7,marker='o',ms=3.5)
    ax.set(xlabel='Model − Observation (°C)',ylabel='Depth (m)',xlim=(-extent,extent),ylim=(max(z)+8,0))
    ax.text(.03,.975,'Model cooler (−)',transform=ax.transAxes,va='top',color='#28688e',fontsize=11)
    ax.text(.97,.975,'Model warmer (+)',transform=ax.transAxes,va='top',ha='right',color='#a35e18',fontsize=11)
    ax.grid(alpha=.16);fig.text(.13,.035,footer,fontsize=9,linespacing=1.5)
    fig.savefig(str(stem)+'_bias_by_depth.png',dpi=300);plt.close(fig)
    fig,ax=plt.subplots(figsize=(10,8));fig.subplots_adjust(top=.81,bottom=.17,left=.11,right=.97)
    fig.suptitle('Argo profile and nearest model cell',x=.11,y=.97,ha='left',fontsize=21,color=navy)
    fig.text(.11,.865,subtitle,fontsize=10.5,linespacing=1.7)
    xx,yy=np.meshgrid(grid_lon,grid_lat);ax.scatter(xx,yy,s=4,color='#c4d4df',label='Model grid centres',zorder=1)
    lo,la=summary['observation_longitude'],summary['observation_latitude']
    ml,ma=summary['model_cell_longitude'],summary['model_cell_latitude']
    def draw(a,legend=False):
        a.plot([lo,ml],[la,ma],color='#a44e6d',lw=1.8,zorder=4)
        a.scatter([lo],[la],s=70,c=orange,edgecolor='white',linewidth=1,zorder=6,label='Argo observation' if legend else None)
        a.scatter([ml],[ma],s=80,c=teal,marker='s',edgecolor='white',linewidth=1,zorder=5,label='Nearest valid model cell' if legend else None)
    draw(ax,True)
    ax.annotate(f"{summary['spatial_distance_km']:.3f} km",(lo,la),xytext=(28,-42),textcoords='offset points',arrowprops={'arrowstyle':'-','color':navy},fontsize=11)
    ax.set(xlim=(67,70),ylim=(12,14),xlabel='Longitude',ylabel='Latitude',facecolor='#f6fafc')
    ax.set_aspect(1/np.cos(np.radians(13)))
    ax.xaxis.set_major_formatter(FuncFormatter(lambda x,p:f'{x:g}°E'));ax.yaxis.set_major_formatter(FuncFormatter(lambda y,p:f'{y:g}°N'))
    ax.grid(alpha=.2);ax.legend(loc='lower right',fontsize=10,framealpha=.95)
    inset=ax.inset_axes([.58,.52,.36,.38]);inset.scatter(xx,yy,s=18,color='#c4d4df');draw(inset)
    midlo,midla=(lo+ml)/2,(la+ma)/2
    inset.set(xlim=(midlo-.065,midlo+.065),ylim=(midla-.045,midla+.045));inset.set_aspect(1/np.cos(np.radians(la)))
    inset.set_title('Local separation',fontsize=10);inset.tick_params(labelsize=8);inset.grid(alpha=.18)
    inset.ticklabel_format(useOffset=False,style='plain');ax.indicate_inset_zoom(inset,edgecolor='#627989',alpha=.6)
    fig.text(.11,.045,'Coordinate context: 67–70°E, 12–14°N · Local equirectangular view, no coastline layer\n'+footer,fontsize=8.5,linespacing=1.5)
    fig.savefig(str(stem)+'_map_context.png',dpi=300);plt.close(fig)


def run(config_path):
    import netCDF4 as nc
    import gsw
    config_path=pathlib.Path(config_path).resolve();config=json.loads(config_path.read_text())
    out=(config_path.parent/config['output_directory']).resolve();out.mkdir(parents=True,exist_ok=True)
    inputs=config['inputs'];before={}
    for name,source in inputs.items():
        actual=sha256(source['path'])
        if actual != source['sha256']:
            raise ValueError('Input checksum mismatch: '+name)
        before[name]=actual
    profiles={p['profile_id']:p for p in json.loads(pathlib.Path(inputs['argo_profiles']['path']).read_text())}
    levels=collections.defaultdict(list)
    for line in pathlib.Path(inputs['argo_levels']['path']).read_text().splitlines():
        row=json.loads(line)
        if row['profile_id'] in config['profile_ids']:
            levels[row['profile_id']].append(row)
    results=[];audit=[];plotdata={}
    with nc.Dataset(inputs['model_netcdf']['path']) as model,nc.Dataset(inputs['argo_raw']['path']) as argo:
        theta=model[config['model_variable']]
        if theta.standard_name != 'sea_water_potential_temperature' or theta.units != 'degrees_C':
            raise ValueError('Unexpected model temperature definition')
        if theta.dimensions != ('time','depth','latitude','longitude'):
            raise ValueError('Unexpected model dimension order')
        for name,unit in [('TEMP_ADJUSTED','degree_Celsius'),('PRES_ADJUSTED','decibar'),('PSAL_ADJUSTED','psu')]:
            if argo[name].units != unit:
                raise ValueError('Unexpected Argo units: '+name)
        z=numeric(model['depth'][:]);lon=numeric(model['longitude'][:]);lat=numeric(model['latitude'][:])
        if model['depth'].positive != 'down' or model['depth'].units != 'm':
            raise ValueError('Unexpected model depth definition')
        if len(model['time']) != 1:
            raise ValueError('This bounded engine requires exactly one daily time slice')
        mt=nc.num2date(model['time'][0],model['time'].units,calendar=model['time'].calendar).isoformat()+'Z'
        if parse_time(mt).date() != parse_time(config['time_policy']['coverage_start_utc']).date():
            raise ValueError('Model timestamp and configured coverage day differ')
        cube=theta[0,:,:,:]
        for pid in config['profile_ids']:
            p=profiles[pid];pi=p['source_profile_index']
            if p['data_mode'] != 'D' or qc_string(argo['DATA_MODE'][pi]) != 'D':
                raise ValueError('Only the two specified delayed-mode profiles are supported')
            for curated,raw in [('latitude','LATITUDE'),('longitude','LONGITUDE')]:
                if p[curated] != float(argo[raw][pi]):raise ValueError('Profile coordinate lineage mismatch')
            for curated,raw in [('position_qc','POSITION_QC'),('time_qc','JULD_QC')]:
                if p[curated] != qc_string(argo[raw][pi]):raise ValueError('Profile QC lineage mismatch')
            raw_time=nc.num2date(argo['JULD'][pi],argo['JULD'].units).isoformat()+'Z'
            if raw_time != p['time_utc']:raise ValueError('Profile time lineage mismatch')
            if p['source_sha256'] != before['argo_raw']:raise ValueError('Argo source lineage mismatch')
            time=config['time_policy']
            offset,mid_offset=time_offsets(p['time_utc'],mt,time['coverage_start_utc'],time['coverage_end_exclusive_utc'],time['representative_midpoint_utc'])
            candidates=[];excluded=collections.Counter()
            for r in levels[pid]:
                j=r['source_level_index'];reason=''
                for key in ['PRES_ADJUSTED','TEMP_ADJUSTED','PSAL_ADJUSTED']:
                    val=scalar(argo[key][pi,j]);cached=r[key]
                    if val != cached:raise ValueError('Curated/raw measurement lineage mismatch: '+key)
                    if qc_string(argo[key+'_QC'][pi,j]) != r[key+'_QC']:raise ValueError('Curated/raw QC lineage mismatch')
                vals=numeric([r['PRES_ADJUSTED'],r['TEMP_ADJUSTED'],r['PSAL_ADJUSTED']],fill_values=(99999,))
                if not qc_accepts(p,r,tuple(config['accepted_provider_qc'])):reason='provider_qc_rejected'
                elif not np.all(np.isfinite(vals)):reason='missing_or_fill'
                else:
                    pressure,temp,sp=vals
                    dep=float(-gsw.z_from_p(pressure,p['latitude']))
                    if not np.isclose(dep,r['depth_m'],rtol=0,atol=1e-8):raise ValueError('Curated depth derivation mismatch')
                    if not z[0] <= dep <= z[-1]:reason='outside_model_depth_range'
                    else:
                        sa=gsw.SA_from_SP(sp,pressure,p['longitude'],p['latitude'])
                        potential=float(gsw.pt0_from_t(sa,temp,pressure))
                        if not np.isfinite(potential):reason='nonfinite_temperature_conversion'
                        else:
                            if not np.isclose(potential,r['potential_temperature_0dbar_degC'],rtol=0,atol=1e-8):raise ValueError('Curated temperature conversion mismatch')
                            candidates.append({'source_level_index':j,'observation_depth_m':dep,'observed_temperature':potential,'observed_in_situ_temperature_celsius':float(temp),'pressure_dbar':float(pressure),'pressure_qc':r['PRES_ADJUSTED_QC'],'temperature_qc':r['TEMP_ADJUSTED_QC'],'salinity_auxiliary_qc':r['PSAL_ADJUSTED_QC']})
                if reason:
                    excluded[reason]+=1;audit.append({'profile_id':pid,'source_level_index':j,'status':'excluded','reason':reason})
            if not candidates:raise ValueError('No eligible observations')
            candidates.sort(key=lambda r:r['observation_depth_m'])
            targets=[r['observation_depth_m'] for r in candidates]
            iy,ix,distance,column=nearest_valid_cell(p['longitude'],p['latitude'],lon,lat,z,cube,targets,config['max_cell_distance_km'],config['earth_radius_km'])
            interp=interpolate_no_extrapolation(z,column,targets)
            matched=[]
            for r,m in zip(candidates,interp):
                if not np.isfinite(m):
                    excluded['invalid_model_vertical_bracket']+=1
                    audit.append({'profile_id':pid,'source_level_index':r['source_level_index'],'status':'excluded','reason':'invalid_model_vertical_bracket'});continue
                hi=int(np.searchsorted(z,r['observation_depth_m']));lo=hi if hi<len(z) and z[hi]==r['observation_depth_m'] else hi-1
                delta=float(m-r['observed_temperature'])
                matched.append({'profile_id':pid,**r,'model_temperature_interpolated':float(m),'signed_bias_celsius':delta,'absolute_error_celsius':abs(delta),'qc_status':'accepted_provider_flag_1','position_qc':p['position_qc'],'time_qc':p['time_qc'],'model_lower_depth_m':float(z[lo]),'model_upper_depth_m':float(z[hi]),'temperature_basis':'potential_temperature_0_dbar','spatial_distance_km':distance,'time_offset_hours':offset,'time_offset_from_daily_midpoint_hours':mid_offset})
            metrics=calculate_metrics([r['observed_temperature'] for r in matched],[r['model_temperature_interpolated'] for r in matched])
            if metrics['matched_level_count'] != config['expected_counts'][pid]:
                raise ValueError('Matched count differs from the inspected input fixture')
            fileid=f"{p['platform_id']}_cycle{p['cycle']:03}_{p['direction']}"
            s={'profile_id':pid,'file_id':fileid,'platform_id':p['platform_id'],'cycle':p['cycle'],'direction':p['direction'],**metrics,'spatial_distance_km':distance,'time_offset_hours':offset,'time_offset_from_daily_midpoint_hours':mid_offset,'observation_time_utc':p['time_utc'],'model_encoded_timestamp_utc':mt,'model_daily_mean_midpoint_utc':time['representative_midpoint_utc'],'model_time_support_start_utc':time['coverage_start_utc'],'model_time_support_end_exclusive_utc':time['coverage_end_exclusive_utc'],'observation_longitude':p['longitude'],'observation_latitude':p['latitude'],'model_cell_longitude':float(lon[ix]),'model_cell_latitude':float(lat[iy]),'model_cell_indices':{'latitude':iy,'longitude':ix},'shallowest_matched_depth_m':min(r['observation_depth_m'] for r in matched),'deepest_matched_depth_m':max(r['observation_depth_m'] for r in matched),'model_valid_depth_min_m':float(z[np.isfinite(column)].min()),'model_valid_depth_max_m':float(z[np.isfinite(column)].max()),'curated_input_level_count':len(levels[pid]),'excluded_from_curated_input':dict(excluded),'temperature_units':'degree_Celsius','temperature_basis':'potential temperature referenced to 0 dbar','qc_policy':'Provider QC 1 for position, time, adjusted pressure, adjusted temperature and auxiliary adjusted salinity','comparison_status':'diagnostic_only_with_documented_thermodynamic_and_temporal_limitations'}
            results.append(s);plotdata[pid]=(matched,column)
            write_csv(out/f'profile_{fileid}_level_comparison.csv',matched)
            write_csv(out/f'profile_{fileid}_model_native_profile.csv',[{'model_depth_m':float(depth),'model_potential_temperature_celsius':float(t) if np.isfinite(t) else ''} for depth,t in zip(z,column)])
        results.sort(key=ranking_key)
        for rank,s in enumerate(results,1):
            s.update(rank=rank,selected_for_first_demo=rank==1)
            write_json(out/f"profile_{s['file_id']}_summary.json",s)
            rows,column=plotdata[s['profile_id']]
            figures(out,s,rows,z,column,lon,lat)
    fields=['rank','profile_id','file_id','platform_id','cycle','direction','matched_level_count','time_offset_hours','time_offset_from_daily_midpoint_hours','spatial_distance_km','mean_bias_celsius','mae_celsius','rmse_celsius','maximum_absolute_error_celsius','shallowest_matched_depth_m','deepest_matched_depth_m','selected_for_first_demo']
    write_csv(out/'profile_ranking.csv',[{k:s[k] for k in fields} for s in results])
    write_csv(out/'excluded_levels.csv',audit)
    after={name:sha256(source['path']) for name,source in inputs.items()}
    if before != after:raise ValueError('Source input changed during comparison')
    provenance={'created_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'project':config['project'],'team':config['team'],'inputs':inputs,'source_checksums_before':before,'source_checksums_after':after,'raw_unchanged':True,'configuration_sha256':sha256(config_path),'engine_sha256':sha256(__file__),'environment':{'python':platform.python_version(),**{p:importlib.metadata.version(p) for p in ['numpy','netCDF4','gsw','matplotlib']}},'method':config,'source_metadata_directory':'source_metadata','reference_directory':'references','source_dois':{'model':'10.48670/moi-00021','argo':'10.17882/42182'},'best_profile_id':results[0]['profile_id'],'no_synthetic_measurements_in_outputs':True}
    write_json(out/'comparison_provenance.json',provenance)
    print(json.dumps(results,indent=2))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',default=str(pathlib.Path(__file__).with_name('comparison_config.json')))
    run(parser.parse_args().config)
