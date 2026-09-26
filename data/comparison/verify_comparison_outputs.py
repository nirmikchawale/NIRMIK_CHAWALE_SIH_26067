"""Independent validation of delivered CSV values against raw model and summaries."""
import pathlib,json,csv,math,hashlib,numpy as np,netCDF4 as nc
R=pathlib.Path(__file__).resolve().parent
cfg=json.loads((R/'comparison_config.json').read_text())
rank=list(csv.DictReader((R/'profile_ranking.csv').open(encoding='utf-8-sig')))
results=[]
with nc.Dataset(cfg['inputs']['model_netcdf']['path']) as model:
    z=np.array(model['depth'][:]);xx,yy=np.meshgrid(model['longitude'][:],model['latitude'][:])
    for entry in rank:
        s=json.loads((R/f"profile_{entry['file_id']}_summary.json").read_text())
        rows=list(csv.DictReader((R/f"profile_{entry['file_id']}_level_comparison.csv").open(encoding='utf-8-sig')))
        idx=s['model_cell_indices'];col=model['thetao'][0,:,idx['latitude'],idx['longitude']]
        assert not np.ma.getmaskarray(col).any()
        # Independent numpy interpolator: all actual model levels are valid.
        depths=np.array([float(r['observation_depth_m']) for r in rows])
        expected=np.interp(depths,z,col,left=np.nan,right=np.nan)
        observed=np.array([float(r['observed_temperature']) for r in rows])
        recorded=np.array([float(r['model_temperature_interpolated']) for r in rows])
        np.testing.assert_allclose(recorded,expected,atol=1e-12,rtol=0)
        bias=expected-observed
        for r,b in zip(rows,bias):
            assert math.isclose(float(r['signed_bias_celsius']),b,abs_tol=1e-12)
            assert math.isclose(float(r['absolute_error_celsius']),abs(b),abs_tol=1e-12)
            assert all(r[k]=='1' for k in ['pressure_qc','temperature_qc','salinity_auxiliary_qc','position_qc','time_qc'])
            assert z.min()<=float(r['observation_depth_m'])<=z.max()
        n=len(rows)
        metrics={'mean_bias_celsius':math.fsum(bias)/n,'mae_celsius':math.fsum(abs(bias))/n,'rmse_celsius':math.sqrt(math.fsum(float(b*b) for b in bias)/n),'maximum_absolute_error_celsius':float(max(abs(bias)))}
        for k,v in metrics.items():assert math.isclose(v,s[k],rel_tol=1e-12,abs_tol=1e-12)
        # Independent unit-vector great-circle calculation, not the haversine implementation.
        def unit(lon,lat):
            lon,lat=np.radians(np.asarray(lon,dtype=np.float64)),np.radians(np.asarray(lat,dtype=np.float64))
            return np.stack([np.cos(lat)*np.cos(lon),np.cos(lat)*np.sin(lon),np.sin(lat)],axis=-1)
        a=unit(s['observation_longitude'],s['observation_latitude']);b=unit(xx,yy)
        dist=6371.0088*np.arctan2(np.linalg.norm(np.cross(a,b),axis=-1),np.sum(a*b,axis=-1))
        best=np.unravel_index(np.argmin(dist),dist.shape)
        assert best==(idx['latitude'],idx['longitude'])
        assert math.isclose(float(dist[best]),s['spatial_distance_km'],abs_tol=1e-8)
        results.append({'profile_id':s['profile_id'],'matched_levels':n,'interpolation_metrics_qc_bounds_nearest_cell':'PASS'})
for name,item in cfg['inputs'].items():assert hashlib.sha256(pathlib.Path(item['path']).read_bytes()).hexdigest()==item['sha256']
assert sum(r['matched_levels'] for r in results)==99
report={'status':'PASS','source_checksums_unchanged':True,'independent_checks':['numpy.interp agrees with engine interpolation for all 99 real matched levels','math.fsum recomputation agrees with CSV/JSON metrics','unit-vector atan2 distances verify haversine and nearest cell','all matched rows have five provider QC flags equal to 1','all depths within actual model range'],'profiles':results}
(R/'verification_results.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report,indent=2))
